# Ria SEONG — 확정 프롬프트 세트
# 2026.06.17 최신 업데이트
# Seed: Random (N/A)
# Base Image: ria_neutral.png ✅

---

## ⚙️ 기본 설정
```
Model:     NAI Diffusion Anime V4.5 Full (nai-diffusion-4-5-full)
           또는 V4.5 Curated (nai-diffusion-4-5-curated)
Sampler:   DPM++ 2M (k_dpmpp_2m)
Steps:     28
Guidance:  7
Seed:      Random (N/A)
Size:      832 × 1216

Vibe Transfer (레퍼런스):
  Image:    ria_neutral.png (Seed 1535612447)
  Strength: 0.65  (information_extracted)
  Fidelity: 0.55  (→ secondary_strength = 0.45)
```

---

## 📋 [1] Base 프롬프트
```
game cg style, visual novel cg, soft shading, vibrant color,
clean illustration, smooth coloring, upper body, transparent background,
soft coloring, no outlines,
```

## 🚫 [2] Base 네거티브
```
sketch, pencil, rough lines, monochrome, greyscale, dark, gloomy,
bad anatomy, lowres, blurry, watermark,
chibi, loli, child, teenager, baby face,
school uniform, overly cute,
pink shirt, pink tint, colored shirt,
deformed proportions,
purple hair, blue hair, blue tint on hair,
pink neck, skin discoloration,
ink lines, comic book style, heavy outline,
white highlight on hair, bright highlight,
overexposed hair, washed out hair,
brown hair
```

---

## 👤 [3] 캐릭터 프롬프트 (Character Desired)
```
1girl, korean woman, age 21,
pale skin, small face, beautiful face,
fair skin, natural skin tone,
rosy cheeks, natural makeup, defined eyebrows,
sharp almond eyes, dark amber eyes, warm brown eyes,
slender figure, slim waist, slightly full chest,
balanced proportions,
jet black hair, dark black hair,
shoulder length hair, loose hair,
hair down, no hair tie, sleek,
loose strands framing face,
pure white polo shirt, button collar,
short sleeve, blue denim jeans,
```

## 🚫 [4] 캐릭터 네거티브 (Character Undesired)
```
short hair, very short hair, chin length hair,
pixie cut, bob,
purple hair, blue hair, violet hair,
blue highlight, purple highlight,
dark hair, no highlights, matte black hair,
bright eyes, overexposed eyes, orange eyes,
bored, sleepy, dull expression
```

---

## 🎭 표정 13종 — mood + pose 교체값

| 표정 | mood | pose |
|------|------|------|
| neutral   | relaxed, casual, natural, | slight smile |
| happy     | warm, joyful, bright, | gentle smile, happy expression, eyes curved happily, slightly flushed |
| surprised | flustered, startled, | eyes wide open, slightly open mouth, eyebrows raised |
| thinking  | pensive, thoughtful, | head slightly tilted, eyes glancing sideways, closed mouth |
| cf3       | patient, gentle, warm, | soft smile, slightly resigned but kind |
| shy       | embarrassed, shy, | averted gaze, rosy cheeks deepened, slight embarrassed smile |
| tsun      | reluctant, defensive, | eyes looking away, slight pout, arms crossed |
| cold      | cool, unimpressed, | eyes half-lidded, slight frown, cold stare |
| ft_a      | neutral, attentive, | one eyebrow slightly raised, casual listening |
| ft_b      | amused, interested, | slight smirk, chin lifted |
| ft_c      | bored, disinterested, | looking sideways, eyes half-lidded |
| ft_d      | surprised, intrigued, | eyes a bit wider, small surprised smile |
| avatar    | friendly, warm, | slight smile, close up face, portrait |

---

## 🎨 의상 변형 교체값

| 씬 | 의상 프롬프트 |
|----|------------|
| 기본 (폴로셔츠) | pure white polo shirt, button collar, short sleeve, blue denim jeans, |
| 후드티 (Day 2)  | light grey hoodie over white shirt, casual, blue denim jeans, |
| 코트 (봄밤)     | beige trench coat, casual, blue denim jeans, |
| 스카프 (Day 3)  | white polo shirt, thin knit scarf around neck, blue denim jeans, |

---

## 📐 시점/구도 교체값

| 구도 | 프롬프트 |
|------|---------|
| 상반신 기본   | upper body, looking at viewer, |
| 전신          | full body, standing pose, looking at viewer, |
| 얼굴 클로즈업 | close up, face focus, looking at viewer, |
| 측면          | upper body, side view, looking away, |
| 아바타        | portrait, close up face, looking at viewer, |

---

## 🔧 어드민 설정 방법

### 설정 탭 → NAI 생성 설정
- Sampler: `DPM++ 2M`
- Noise Schedule: `Exponential`
- Steps: `28`
- Guidance: `7`
- Vibe Transfer 레퍼런스: `ria_neutral.png` 업로드
- Strength: `0.65`
- Fidelity: `0.55`

### 이미지 생성 탭 → 슬롯 선택
- 기분 (mood): 표정 13종 교체값 입력
- 포즈 (pose): 표정 13종 교체값 입력
- 캐릭터 프롬프트: 비우면 기본값 자동 사용
- 캐릭터 UC: 비우면 기본값 자동 사용

---

## 📁 파일 목록

| 파일 | 상태 |
|------|------|
| ria_neutral.png  | ✅ 확정 |
| ria_happy.png    | ✅ |
| ria_surprised.png | ✅ |
| ria_thinking.png  | ✅ |
| ria_cf3.png       | ✅ 확정 |
| ria_shy.png       | ✅ |
| ria_tsun.png      | ✅ 확정 |
| ria_cold.png      | ✅ |
| ria_sparkle.png   | ✅ (Seed 625597453) |
| ria_ft_a.png      | ✅ |
| ria_ft_b.png      | ✅ |
| ria_ft_c.png      | ✅ |
| ria_ft_d.png      | ✅ |
| ria_avatar.png    | ✅ |
| npc_professor     | 미완 |
| npc_jay           | 미완 |

총 14종 (NPC 제외)

---

## 🚀 배포 순서

1차 배포: 이미지 + 게임 로직 (소리 없음)
2차 업데이트: Gemini TTS 오디오 추가
3차 업데이트: BGM + 효과음

---

## 💾 이어하기 정책 (A안 — 로컬 only)

- 저장: IndexedDB + localStorage (자동)
- 복원: 같은 기기에서 자동 이어하기
- 코드: 없음 (다른 기기 이동 불가 — 추후 서버 연동 시 업그레이드)
- 저장 데이터: 친밀도, 현재 Day/발화 idx, riaMemory, 자유대화 기록
