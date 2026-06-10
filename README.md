# RIA English 🌸

교환학생 Ria와 함께하는 100일 영어 학습 게임.

## 구조

```
ria-english/
├── index.html              ← 게임 메인 (Vercel 배포)
├── scenarios/
│   ├── day1.json           ← Day 1 시나리오
│   └── url_map.json        ← 이미지 URL 맵 (자동 생성)
├── images/
│   └── ria/                ← NovelAI 생성 이미지
├── scripts/
│   ├── generate_images.py  ← NovelAI 이미지 자동 생성
│   └── upload_drive.py     ← Google Drive 업로드 + URL 기록
└── .env.example            ← 환경변수 예시
```

## 이미지 자동화 파이프라인

### 1. NovelAI 이미지 생성
```bash
pip install requests
python scripts/generate_images.py --key YOUR_NOVELAI_KEY
```

### 2. Google Drive 업로드
```bash
pip install google-api-python-client google-auth
python scripts/upload_drive.py --creds credentials.json
```

### 3. Vercel 배포
GitHub push → Vercel 자동 배포

## 환경변수 (Vercel)
```
NOVELAI_KEY=your_key_here
```

## 이미지 목록 (Day 1 기준 18종)
| 파일명 | 용도 |
|---|---|
| ria_curious | 기본 대기, 호기심 |
| ria_confused | CF1 당황 |
| ria_thinking | CF2 유도 |
| ria_smile_soft | 정답 CF 보상 |
| ria_smile_bright | 즉답 보상 |
| ria_smile_warm | 마지막 발화 |
| ria_surprised | 놀란 표정 |
| ria_excited | 신남 |
| ria_urgent | 급함 |
| ria_hopeful | 기대하는 눈 |
| ria_relieved | 안도 |
| ria_grateful | 감사 |
| ria_struggling | 고군분투 |
| ria_distracted | 폰에 신경 쓰임 |
| ria_refocused | 다시 집중 |
| ria_warm_flushed | 볼 붉어짐 |
| ria_happy_menu | 메뉴 보며 행복 |
| ria_cold_night | 봄밤 쌀쌀함 |
