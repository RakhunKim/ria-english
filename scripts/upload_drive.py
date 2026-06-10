#!/usr/bin/env python3
"""
RIA English — Google Drive 업로드 + JSON URL 자동 기록
Usage: python scripts/upload_drive.py --creds credentials.json
"""

import os, sys, json, argparse
from pathlib import Path

try:
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    GDRIVE_OK = True
except ImportError:
    GDRIVE_OK = False
    print("⚠ google-api-python-client 미설치")
    print("  pip install google-api-python-client google-auth")


SCOPES = ["https://www.googleapis.com/auth/drive.file"]
FOLDER_NAME = "ria-english-images"


def get_or_create_folder(service, name: str) -> str:
    # 폴더 검색
    results = service.files().list(
        q=f"name='{name}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields="files(id, name)"
    ).execute()
    files = results.get("files", [])
    if files:
        return files[0]["id"]
    
    # 없으면 생성
    meta = {"name": name, "mimeType": "application/vnd.google-apps.folder"}
    folder = service.files().create(body=meta, fields="id").execute()
    folder_id = folder["id"]
    
    # 공개 접근 설정
    service.permissions().create(
        fileId=folder_id,
        body={"type": "anyone", "role": "reader"}
    ).execute()
    return folder_id


def upload_image(service, folder_id: str, img_path: Path) -> str:
    media = MediaFileUpload(str(img_path), mimetype="image/png")
    meta = {"name": img_path.name, "parents": [folder_id]}
    
    # 기존 파일 있으면 삭제
    existing = service.files().list(
        q=f"name='{img_path.name}' and '{folder_id}' in parents and trashed=false",
        fields="files(id)"
    ).execute().get("files", [])
    for f in existing:
        service.files().delete(fileId=f["id"]).execute()
    
    file = service.files().create(body=meta, media_body=media, fields="id").execute()
    file_id = file["id"]
    
    # 공개 접근
    service.permissions().create(
        fileId=file_id,
        body={"type": "anyone", "role": "reader"}
    ).execute()
    
    # 직접 링크 형식
    return f"https://drive.google.com/uc?id={file_id}"


def main():
    if not GDRIVE_OK:
        sys.exit(1)

    parser = argparse.ArgumentParser()
    parser.add_argument("--creds", required=True, help="서비스 계정 credentials.json 경로")
    parser.add_argument("--img-dir", default="images/ria", help="이미지 디렉토리")
    parser.add_argument("--scenario-dir", default="scenarios", help="시나리오 JSON 디렉토리")
    args = parser.parse_args()

    creds = Credentials.from_service_account_file(args.creds, scopes=SCOPES)
    service = build("drive", "v3", credentials=creds)

    folder_id = get_or_create_folder(service, FOLDER_NAME)
    print(f"Drive 폴더 ID: {folder_id}\n")

    img_dir = Path(args.img_dir)
    url_map = {}

    images = list(img_dir.glob("*.png"))
    print(f"업로드할 이미지: {len(images)}개\n")

    for i, img_path in enumerate(images, 1):
        print(f"[{i}/{len(images)}] {img_path.name}...", end=" ", flush=True)
        try:
            url = upload_image(service, folder_id, img_path)
            url_map[img_path.stem] = url
            print(f"✓")
        except Exception as e:
            print(f"✗ {e}")

    # URL 맵 저장
    url_map_path = Path(args.img_dir) / "url_map.json"
    with open(url_map_path, "w") as f:
        json.dump(url_map, f, indent=2)
    print(f"\nURL 맵 저장: {url_map_path}")

    # 시나리오 JSON에 URL 자동 기록 (선택)
    for scenario_file in Path(args.scenario_dir).glob("*.json"):
        with open(scenario_file) as f:
            data = json.load(f)
        
        updated = False
        for u in data.get("utterances", []):
            for field in ["ria_image"]:
                img_key = u.get(field)
                if img_key and img_key in url_map:
                    u[field + "_url"] = url_map[img_key]
                    updated = True
            for sub in ["reward_instant", "reward_cf", "cf1", "cf2", "cf3"]:
                img_key = u.get(sub, {}).get("ria_image")
                if img_key and img_key in url_map:
                    u[sub]["ria_image_url"] = url_map[img_key]
                    updated = True
        
        if updated:
            with open(scenario_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"URL 업데이트: {scenario_file.name}")

    print("\n✅ 완료!")


if __name__ == "__main__":
    main()
