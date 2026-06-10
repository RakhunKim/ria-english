#!/usr/bin/env python3
"""
RIA English — NovelAI 이미지 자동 생성 스크립트
Usage: python scripts/generate_images.py --key YOUR_NOVELAI_KEY
"""

import os, sys, json, time, argparse, base64, hashlib
from pathlib import Path
import urllib.request, urllib.error

# =============================================
# Ria 베이스 프롬프트 (시드 이미지 기반)
# =============================================
BASE_POSITIVE = (
    "1girl, black low ponytail, side-swept bangs, amber brown eyes, "
    "small hoop earring, white polo shirt, blue jeans, "
    "natural makeup, soft blush cheeks, "
    "clean line art, manga style, korean webtoon style, "
    "best quality, masterpiece, "
    "upper body, white background, simple background"
)

BASE_NEGATIVE = (
    "lowres, bad anatomy, bad hands, text, error, missing fingers, "
    "extra digit, fewer digits, cropped, worst quality, low quality, "
    "jpeg artifacts, signature, watermark, username, blurry, "
    "multiple girls, nsfw, suggestive"
)

# =============================================
# 표정별 추가 프롬프트
# =============================================
EXPRESSIONS = {
    "ria_curious":      ("slight smile, head tilt, curious eyes, looking at viewer", ""),
    "ria_confused":     ("confused expression, head tilt, slightly furrowed brows, questioning look", ""),
    "ria_thinking":     ("thinking expression, looking to the side, finger on chin, thoughtful", ""),
    "ria_smile_soft":   ("soft gentle smile, warm eyes, relaxed expression", ""),
    "ria_smile_bright": ("bright smile, happy expression, eyes curved, cheerful", ""),
    "ria_smile_warm":   ("warm tender smile, soft gaze, gentle expression, slight blush", ""),
    "ria_surprised":    ("surprised expression, wide eyes, open mouth slightly, startled", ""),
    "ria_excited":      ("excited expression, big smile, energetic, bright eyes", ""),
    "ria_urgent":       ("urgent expression, slightly panicked, wide eyes, looking sideways", ""),
    "ria_hopeful":      ("hopeful expression, soft pleading eyes, slight smile, expectant", ""),
    "ria_relieved":     ("relieved expression, eyes closed slightly, exhaling, relaxed smile", ""),
    "ria_grateful":     ("grateful expression, warm smile, soft eyes, touched expression", ""),
    "ria_struggling":   ("struggling expression, slight frown, focused, determined", ""),
    "ria_distracted":   ("distracted expression, looking down at phone, slightly guilty", "holding phone"),
    "ria_refocused":    ("refocused expression, turning attention back, attentive look, soft smile", ""),
    "ria_warm_flushed": ("warm flushed cheeks, slightly embarrassed smile, rosy blush", ""),
    "ria_happy_menu":   ("happy expression, looking to the side, excited eyes", ""),
    "ria_cold_night":   ("slightly cold, jacket in hand, soft lingering smile, night vibe", "thin jacket in hand"),
}

# =============================================
# NovelAI API 호출
# =============================================
def generate_image(api_key: str, name: str, expr_positive: str, expr_extra: str) -> bytes:
    positive = f"{expr_positive}, {expr_extra}, {BASE_POSITIVE}" if expr_extra else f"{expr_positive}, {BASE_POSITIVE}"
    
    payload = json.dumps({
        "input": positive,
        "model": "nai-diffusion-3",
        "action": "generate",
        "parameters": {
            "width": 512,
            "height": 768,
            "scale": 7,
            "sampler": "k_euler_ancestral",
            "steps": 28,
            "n_samples": 1,
            "ucPreset": 0,
            "qualityToggle": True,
            "negative_prompt": BASE_NEGATIVE,
            "seed": int(hashlib.md5(name.encode()).hexdigest(), 16) % (2**32),
            "sm": False,
            "sm_dyn": False,
        }
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://image.novelai.net/ai/generate-image",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read())
    
    # NAI returns base64 encoded image
    img_b64 = result.get("output", [None])[0]
    if not img_b64:
        raise ValueError(f"No output for {name}")
    return base64.b64decode(img_b64)


# =============================================
# MAIN
# =============================================
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--key", required=True, help="NovelAI API key")
    parser.add_argument("--out", default="images/ria", help="Output directory")
    parser.add_argument("--only", nargs="*", help="Only generate specific images")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    targets = args.only if args.only else list(EXPRESSIONS.keys())
    
    print(f"생성할 이미지: {len(targets)}개")
    print(f"저장 위치: {out_dir}/\n")

    for i, name in enumerate(targets, 1):
        out_path = out_dir / f"{name}.png"
        
        if out_path.exists():
            print(f"[{i}/{len(targets)}] {name} — 이미 존재, 스킵")
            continue

        expr_pos, expr_extra = EXPRESSIONS[name]
        print(f"[{i}/{len(targets)}] {name} 생성 중...", end=" ", flush=True)
        
        try:
            img_bytes = generate_image(args.key, name, expr_pos, expr_extra)
            out_path.write_bytes(img_bytes)
            print(f"✓ ({len(img_bytes)//1024}KB)")
            time.sleep(1.5)  # rate limit 방지
        except Exception as e:
            print(f"✗ 오류: {e}")
            time.sleep(3)

    print(f"\n완료! {out_dir} 에 저장됨")


if __name__ == "__main__":
    main()
