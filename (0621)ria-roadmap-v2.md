# RIA English — 개발 로드맵 v2
## 2026.06.17 업데이트

---

## ✅ 완료된 것들

### 인프라
- Vercel 배포 완료 (`ria-english.vercel.app`)
- NAI 프록시 (`api/nai.js`) — multipart/form-data, adm-zip PNG 추출
- remove.bg 프록시 (`api/rmbg.js`)
- 환경 자동 감지 (로컬 vs Vercel)

### 어드민 (admin.html)
- 이미지 생성 파이프라인 작동
- 4레이어 프롬프트 구조 (Base / Character / Scene / Vibe Transfer)
- 설정 탭: 모델/Sampler/Steps/Guidance/Vibe Transfer/Base Prompt/Base UC
- 캐릭터 탭: Ria / 교수 / Jay / Mina / Chen / Nguyen Character Prompt + UC
- 공통 슬롯: professor, jay, mina, chen, nguyen (neutral/happy/surprised/thinking)
- 이미지 저장 버튼 (슬롯 패널 + 생성 결과)
- Rate limit 대비 딜레이 + 자동 재시도

### 게임 (index.html)
- Beat 시스템, FreeTalk, IndexedDB, CF1~CF3, 친밀도
- Claude API FreeTalk 연동

---

## 🔜 다음 작업

### 즉시
- [ ] 피키캐스트 TTS API 연동 (`api/tts.js` 프록시 추가)
- [ ] 이미지 생성 500 에러 디버깅

### Phase 1 — 데이터 수집
- [ ] Vercel KV 설정
- [ ] `api/log.js` — 발화 데이터 저장
- [ ] 게임에 로깅 코드 추가
- 저장 데이터: user_id / utterance_id / input / is_correct / attempt / timestamp

### Phase 2 — 정오답 판별 개선
- [ ] `isCorrect()` Rule-based 추가
  - policy: exact / flexible / rule / keyword / ai
  - must_include / must_exclude / min_words
  - 오타 허용: Levenshtein Distance (단어 길이별 허용 오타 수)
    - 1-3글자: 오타 0
    - 4-6글자: 오타 1
    - 7글자+: 오타 2
- [ ] 시나리오 JSON에 `scoring_policy` 필드 추가 (U별 설정)

### Phase 3 — 어드민 판별 검토 탭
- [ ] 수집된 발화 데이터 조회 (U별)
- [ ] Claude가 정문/오문 분류 + 이유 제시
- [ ] 사람이 승인/거부 (클릭만)
- [ ] 수동 예문 직접 추가 (Claude 제안 없이도 가능)
  - 입력: 예문 텍스트
  - 판별: 정문 / 오문 선택
  - 추가 버튼
- [ ] 기존 correct 배열 직접 편집 (추가/삭제)
- [ ] 승인 시 시나리오 JSON correct 배열 자동 업데이트

### Phase 4 — 콘텐츠
- [ ] Day 1 이미지 37개 생성
- [ ] TTS 생성 (피키캐스트 API)
- [ ] BGM 업로드 (수노에서 수동)
- [ ] Day 2 시나리오 설계

---

## 📋 현재 파일 구조

```
ria-english/ (GitHub)
├── api/
│   ├── nai.js       — NAI 이미지 생성 프록시
│   └── rmbg.js      — remove.bg 프록시
├── admin.html       — 어드민
├── index.html       — 게임
├── vercel.json
└── ria-prompt-settings.md
```

---

## 🎨 이미지 생성 설정

```
모델:      NAI Diffusion V4.5 Curated (nai-diffusion-4-5-curated)
Sampler:   DPM++ 2M (k_dpmpp_2m)
Steps:     28
Guidance:  7
Seed:      Random
Noise:     Exponential

Vibe Transfer:
  이미지:   ria_neutral.png
  Strength: 0.65
  Fidelity: 0.55
```

---

## 🔧 API 현황

| API | 방식 | 상태 |
|-----|------|------|
| NAI | Vercel 프록시 | ✅ 작동 |
| remove.bg | Vercel 프록시 | ✅ (키 필요) |
| Gemini TTS | 브라우저 직접 | ✅ 작동 |
| 피키캐스트 TTS | Vercel 프록시 예정 | 🔜 키 준비 중 |
| Claude FreeTalk | 브라우저 직접 | ✅ 작동 |
| Vercel KV | 미설정 | 🔜 Phase 1 |
| 수노 BGM | API 없음 → 수동 업로드 | 수동 |

---

## 💾 데이터 보존 정책

- 이미지: IndexedDB (브라우저) → 코드 업데이트해도 안 날아감
- 설정/프롬프트: localStorage → 안 날아감
- 발화 로그: Vercel KV 예정 (Phase 1)
- 다른 기기 이동: 현재 불가 → Vercel KV 연동 후 가능

---

## 👥 캐릭터 슬롯 현황

| 캐릭터 | 공통 슬롯 | 씬별 슬롯 |
|--------|---------|---------|
| Ria | - | D01_U0X_BX_ria (37개) |
| Professor | neutral, talking | 씬별 추가 예정 |
| Jay | neutral, happy, surprised, thinking | 추후 시나리오에서 |
| Mina | neutral, happy, surprised, thinking | 추후 시나리오에서 |
| Chen | neutral, happy, surprised, thinking | 추후 시나리오에서 |
| Nguyen | neutral, happy, surprised, thinking | 추후 시나리오에서 |
