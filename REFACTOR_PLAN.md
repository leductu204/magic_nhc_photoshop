# REFACTOR PLAN — Magic NHC: chuyển tier sang **Miễn phí / Nano / Nano Pro** + tích hợp chuẩn Trạm Sáng Tạo API

## Nguồn tham chiếu đã dùng
- Project cần refactor: `/root/.openclaw/workspace/magic-nhc/`
- API docs nội bộ đã đối chiếu:
  - `/root/.openclaw/workspace/magic-tool/API_REVIEW.md`
  - `/root/.openclaw/workspace/magic-tool/FIX_SUMMARY.md`
  - `/root/.openclaw/workspace/magic-tool/PlaygroundModal.tsx`

Các điểm chuẩn API quan trọng được chốt theo tham chiếu trên:
- Generate endpoint: `POST /v1/image/generate` (không phải `/v1/generate`)
- Body fields chuẩn: `prompt`, `model`, `resolution`, `aspect_ratio`, `speed`, `input_image` (file, multiple)
- Poll: `GET /v1/jobs/{job_id}`
- Nên hỗ trợ parser trạng thái linh hoạt (`completed/succeeded/...`)

---

## 1) Tóm tắt kiến trúc hiện tại (magic-nhc)

## File và vai trò
- `index.tsx`: mount app React, không chứa logic tier/generation.
- `App.tsx`: orchestration chính
  - giữ state theo `viewMode`
  - gọi service generate tương ứng
  - lưu ảnh vào gallery
- `components/ControlPanel.tsx`: toàn bộ UI settings + selector model tier.
- `services/geminiService.ts`: toàn bộ logic gọi Gemini cho đa số mode ảnh.
- `types.ts`: định nghĩa `ModelType`, `GenerationSettings`.
- `vite.config.ts`: expose env `GEMINI_API_KEY` ra frontend qua `process.env.*`.

## Tier hiện tại
- Free: `'flash'`
- Nano Pro: `'nano-pro'`
- Pro: `'pro-image'`

Tier đang ảnh hưởng trực tiếp đến:
1) Label UI model
2) Điều kiện hiển thị API key
3) Chọn model Gemini (pro/nano/free)
4) Chọn key trong `getAI()`

---

## 2) Vị trí chính xác cần sửa (file + line)

## A) `types.ts`
- `types.ts:36`
  - Hiện tại: `export type ModelType = 'flash' | 'pro-image' | 'nano-pro';`
- `types.ts:100`
  - Hiện tại: `customApiKey?: string;`

### Đổi thành
- Tier mới: `'free' | 'nano' | 'nano-pro'`
- Key field khuyến nghị rõ nghĩa: `tramApiKey?: string` (hoặc giữ `customApiKey` để giảm diff)

---

## B) `App.tsx`
- `App.tsx:54`
  - Default `modelType: 'flash' as ModelType`
- `App.tsx:492-536`
  - `imageSettings` + `setImageSettings` dispatch theo `viewMode`
- `App.tsx:679-714`
  - `generateSingleImage(...)`: gọi các hàm từ `geminiService`
- `App.tsx:726-837`
  - `handleRefineRestoration(...)`: gọi lại generate theo mode
- `App.tsx:3`
  - Import trực tiếp toàn bộ hàm generate từ `geminiService`

### Cần sửa
- Default tier -> `'free'`
- Chuyển luồng gọi service sang **router/facade** theo tier:
  - `free` -> Gemini (giữ nguyên logic hiện tại)
  - `nano` / `nano-pro` -> Trạm Sáng Tạo

---

## C) `components/ControlPanel.tsx`
- `ControlPanel.tsx:351`
  - label cũ: `MÔ HÌNH GEMINI 3.1`
- `ControlPanel.tsx:353`
  - mapping title theo `pro-image/nano-pro/flash`
- `ControlPanel.tsx:365-381`
  - 3 tab tier cũ: `flash`, `nano-pro`, `pro-image`
- `ControlPanel.tsx:384`
  - điều kiện paid cũ: `pro-image || nano-pro`
- `ControlPanel.tsx:407`
  - note billing Google/Gemini
- `ControlPanel.tsx:415-416`
  - input bind `customApiKey`
- `ControlPanel.tsx:531`
  - `isPro = settings.modelType === 'pro-image'`

### Cần sửa
- Tab tier mới: `Miễn Phí (free)`, `Nano (nano)`, `Nano Pro (nano-pro)`
- Bỏ hoàn toàn `pro-image`
- Đổi copywriting từ Gemini billing -> Trạm Sáng Tạo API key
- Điều kiện paid mới: `nano || nano-pro`

---

## D) `services/geminiService.ts`
- `geminiService.ts:94-97` (`getAI`)
- `geminiService.ts:95` logic key phân theo `pro-image || nano-pro`
- `geminiService.ts:370, 429, 592, 705, 770...`
  - nhiều ternary chọn model dựa vào `pro-image`
- `geminiService.ts:602, 689, 740...`
  - config đặc biệt cho tier pro cũ

### Cần sửa
- Gỡ nhánh `pro-image` khỏi toàn bộ ternary
- Gemini chỉ dùng cho tier `free`
- Nano/Nano Pro đi qua service Trạm mới

---

## E) `vite.config.ts`
- `vite.config.ts:14-15`
  - hiện chỉ define GEMINI env

### Cần sửa
Thêm expose key Trạm nếu cần fallback từ env:
```ts
'process.env.TRAMSANGTAO_API_KEY': JSON.stringify(env.TRAMSANGTAO_API_KEY)
```

---

## F) `index.tsx`
- `index.tsx:1-15` không cần chỉnh cho refactor tier.

---

## 3) Kế hoạch refactor theo phase

## Phase 1 — Type + UI Tier

### 1.1 Cập nhật type
```ts
// types.ts
export type ModelType = 'free' | 'nano' | 'nano-pro';

export interface GenerationSettings {
  // ...
  modelType: ModelType;
  tramApiKey?: string; // hoặc giữ customApiKey nếu muốn ít thay đổi
}
```

### 1.2 Cập nhật default
```ts
// App.tsx (DEFAULT_GENERATION_SETTINGS)
modelType: 'free' as ModelType,
```

### 1.3 Cập nhật selector UI
```tsx
// ControlPanel.tsx
<button onClick={() => onSettingsChange({ modelType: 'free' })}>Miễn Phí</button>
<button onClick={() => onSettingsChange({ modelType: 'nano' })}>Nano</button>
<button onClick={() => onSettingsChange({ modelType: 'nano-pro' })}>Nano Pro</button>
```

Điều kiện paid:
```tsx
const isPaidTier = settings.modelType === 'nano' || settings.modelType === 'nano-pro';
```

---

## Phase 2 — Tạo service mới `services/tramSangTaoService.ts`

> Bản dưới đây bám chuẩn fix patterns từ `API_REVIEW.md` + `FIX_SUMMARY.md` + `PlaygroundModal.tsx`:
> - Endpoint đúng `/v1/image/generate`
> - Dùng **multipart/form-data**
> - field đúng: `resolution`, `aspect_ratio`, `speed`, `input_image` (multiple)
> - model đúng: `nano-banana` / `nano-banana-pro`
> - poll robust status parser

```ts
// services/tramSangTaoService.ts
import { GenerationSettings } from '../types';

const TRAM_BASE_URL = 'https://api.tramsangtao.com';
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 120000;

type TramModel = 'nano-banana' | 'nano-banana-pro';

const successStatuses = new Set(['completed', 'succeeded', 'success', 'done', 'finished']);
const failureStatuses = new Set(['failed', 'error', 'cancelled', 'canceled']);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const normalizeResolution = (size?: string) => {
  // map kiểu app cũ: 1K/2K/4K/5K -> api docs: 1k/2k/4k/5k
  const map: Record<string, string> = {
    '1K': '1k',
    '2K': '2k',
    '4K': '4k',
    '5K': '5k',
    '1k': '1k',
    '2k': '2k',
    '4k': '4k',
    '5k': '5k',
  };
  return map[size || '2K'] || '2k';
};

const normalizeAspectRatio = (ar?: string) => {
  if (!ar || ar === 'auto') return '1:1';
  return ar;
};

const getTramModel = (modelType: GenerationSettings['modelType']): TramModel => {
  return modelType === 'nano-pro' ? 'nano-banana-pro' : 'nano-banana';
};

const getApiKey = (settings: GenerationSettings): string => {
  const key = settings.tramApiKey || (process.env.TRAMSANGTAO_API_KEY as string | undefined);
  if (!key) throw new Error('Thiếu Trạm Sáng Tạo API key.');
  return key;
};

const fileToBlobUrlData = async (url: string): Promise<string> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Không tải được ảnh kết quả: ${res.status}`);
  const blob = await res.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const extractJobId = (payload: any): string | null => {
  return (
    payload?.job_id ||
    payload?.jobId ||
    payload?.data?.job_id ||
    payload?.data?.jobId ||
    null
  );
};

const extractResultUrl = (payload: any): string | null => {
  if (!payload) return null;

  const candidates = [
    payload?.result,
    payload?.url,
    payload?.image,
    payload?.output,
    payload?.data?.result,
    payload?.data?.url,
    payload?.data?.image,
    payload?.data?.output,
    payload?.data?.images?.[0],
    payload?.images?.[0],
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.startsWith('http')) return c;
  }
  return null;
};

const extractStatus = (payload: any): string => {
  return String(payload?.status || payload?.data?.status || '').toLowerCase();
};

export async function generateWithTramSangTao(
  inputImages: File[] | undefined,
  settings: GenerationSettings
): Promise<string> {
  const apiKey = getApiKey(settings);
  const model = getTramModel(settings.modelType);

  const form = new FormData();
  form.append('prompt', settings.userPrompt?.trim() || 'Generate image');
  form.append('model', model);
  form.append('resolution', normalizeResolution(settings.imageSize));
  form.append('aspect_ratio', normalizeAspectRatio(settings.aspectRatio));
  // optional speed (nếu UI chưa có thì không append)
  // form.append('speed', 'quality');

  if (inputImages?.length) {
    inputImages.forEach((f) => form.append('input_image', f));
  }

  const genRes = await fetch(`${TRAM_BASE_URL}/v1/image/generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!genRes.ok) {
    const txt = await genRes.text().catch(() => '');
    throw new Error(`Generate thất bại (${genRes.status}): ${txt}`);
  }

  const genPayload = await genRes.json();
  const jobId = extractJobId(genPayload);
  if (!jobId) throw new Error('Không nhận được job_id từ Trạm Sáng Tạo.');

  const startedAt = Date.now();
  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS);

    const pollRes = await fetch(`${TRAM_BASE_URL}/v1/jobs/${jobId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!pollRes.ok) {
      const txt = await pollRes.text().catch(() => '');
      throw new Error(`Poll thất bại (${pollRes.status}): ${txt}`);
    }

    const pollPayload = await pollRes.json();
    const status = extractStatus(pollPayload);

    if (successStatuses.has(status)) {
      const resultUrl = extractResultUrl(pollPayload);
      if (!resultUrl) throw new Error('Job hoàn tất nhưng thiếu URL kết quả.');
      return await fileToBlobUrlData(resultUrl);
    }

    if (failureStatuses.has(status)) {
      throw new Error(pollPayload?.error || pollPayload?.message || 'Job thất bại.');
    }
  }

  throw new Error('Timeout khi chờ job Trạm Sáng Tạo hoàn tất.');
}
```

---

## Phase 3 — Tạo facade/router generation

Mục tiêu: không sửa dàn trải khắp `App.tsx`.

Tạo file: `services/imageGenerationService.ts`

```ts
import { GenerationSettings, ProfileSettings } from '../types';
import {
  generateStyledImage as generateStyledImageGemini,
  generateBackgroundSwapImage as generateBackgroundSwapImageGemini,
  generatePaintingImage as generatePaintingImageGemini,
  generateFaceStraightenImage as generateFaceStraightenImageGemini,
  generateLifestyleImage as generateLifestyleImageGemini,
  generateMockupImage as generateMockupImageGemini,
  generateLightingEffectImage as generateLightingEffectImageGemini,
  generateRemoveBackgroundImage as generateRemoveBackgroundImageGemini,
  generateSymmetricEditImage as generateSymmetricEditImageGemini,
  generateBabyUltrasoundImage as generateBabyUltrasoundImageGemini,
  generateBabyFromUltrasoundImage as generateBabyFromUltrasoundImageGemini,
  generateArchitectureRenderImage as generateArchitectureRenderImageGemini,
  generateUpscaleExpandImage as generateUpscaleExpandImageGemini,
  generateProfileImage,
} from './geminiService';
import { generateWithTramSangTao } from './tramSangTaoService';

const useTram = (settings: GenerationSettings) =>
  settings.modelType === 'nano' || settings.modelType === 'nano-pro';

export async function generateStyledImage(file: File, settings: GenerationSettings) {
  if (!useTram(settings)) return generateStyledImageGemini(file, settings);
  return generateWithTramSangTao([file], settings);
}

// Mẫu cho các mode khác: nếu tier nano/nano-pro => đi Trạm (nếu backend support I2I cho mode đó)
export async function generateBackgroundSwapImage(file: File, settings: GenerationSettings) {
  if (!useTram(settings)) return generateBackgroundSwapImageGemini(file, settings);
  return generateWithTramSangTao([file, ...(settings.referenceImage ? [settings.referenceImage] : [])], settings);
}

// ... lặp pattern tương tự cho các hàm generate khác
export { generateProfileImage };
```

---

## Phase 4 — Cập nhật `App.tsx` import + call site

## 4.1 Đổi import (line đầu file)
Hiện tại `App.tsx:3` import thẳng từ `./services/geminiService`.

Đổi sang import từ `./services/imageGenerationService` cho các hàm generate ảnh.

## 4.2 Các điểm gọi chính cần migrate
- `App.tsx:685-705` (`generateSingleImage`)
- `App.tsx:772-835` (`handleRefineRestoration`)
- `App.tsx:853-858` (`handleStartBabyPrediction`)

Khi đổi import sang facade, các call site gần như giữ nguyên chữ ký.

---

## Phase 5 — Dọn `geminiService.ts`

- Bỏ toàn bộ logic `pro-image`
- Chuẩn hóa model free là Gemini free path
- `getAI` không còn branch theo tier pro cũ

Ví dụ:
```ts
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey });
};
```

---

## 4) Danh sách UI text/labels cần update (Free/Nano/Nano Pro)

Trong `components/ControlPanel.tsx`:

1. `line ~351`
- Cũ: `MÔ HÌNH GEMINI 3.1`
- Mới gợi ý: `GÓI XỬ LÝ AI`

2. `line ~353` title mapping
- Cũ: `BANANA 3.1 PRO` / `NANO BANANA 3.1 PRO` / `BANANA MIỄN PHÍ`
- Mới: `NANO PRO` / `NANO` / `MIỄN PHÍ`

3. `line ~365-381` tabs
- Cũ: `Miễn Phí`, `Nano Pro`, `Bản Pro`
- Mới: `Miễn Phí`, `Nano`, `Nano Pro`

4. `line ~407` billing help text
- Cũ: nhắc Gemini billing + link Google docs
- Mới: nhắc Trạm Sáng Tạo API key (và có thể link docs nội bộ)

5. `line ~418` placeholder input
- Cũ: `NHẬP API KEY CỦA BẠN...`
- Mới: `NHẬP TRẠM SÁNG TẠO API KEY...`

6. `line ~531` `isPro`
- Cũ: `settings.modelType === 'pro-image'`
- Mới: `const isNanoPro = settings.modelType === 'nano-pro'`

7. Các text “Bản Pro” trong UI khác (search toàn repo)
- đổi thành “Nano Pro” theo naming mới.

---

## 5) Env/config cần cập nhật

## `vite.config.ts`
```ts
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.TRAMSANGTAO_API_KEY': JSON.stringify(env.TRAMSANGTAO_API_KEY),
}
```

`.env`:
```env
GEMINI_API_KEY=...
TRAMSANGTAO_API_KEY=...
```

---

## 6) Checklist triển khai theo thứ tự

1. Đổi type tier trong `types.ts`.
2. Đổi default `modelType` trong `App.tsx`.
3. Đổi UI selector + labels trong `ControlPanel.tsx`.
4. Tạo `services/tramSangTaoService.ts` (theo code chuẩn ở trên).
5. Tạo `services/imageGenerationService.ts` (facade).
6. Chuyển import/call trong `App.tsx` sang facade.
7. Dọn `geminiService.ts` khỏi `pro-image`.
8. Thêm env Trạm trong `vite.config.ts`.
9. Test:
   - Free vẫn chạy Gemini bình thường
   - Nano chạy `nano-banana`
   - Nano Pro chạy `nano-banana-pro`
   - Request generate dùng `multipart/form-data`
   - Field gửi đúng: `resolution`, `aspect_ratio`, `input_image`
   - Poll xử lý status đa dạng + extract URL robust

---

## 7) Lưu ý rủi ro và quyết định cần chốt

- App `magic-nhc` là ảnh hưởng nặng vào **image-to-image** theo từng mode.
- Trạm API theo docs hiện có `input_image` multiple trên cùng endpoint `/v1/image/generate`, nên **có thể** gộp xử lý qua prompt + input_image.
- Tuy nhiên chất lượng/behavior từng mode (background swap, restore, baby ultrasound...) phụ thuộc prompt-engineering và khả năng model thực tế.

Khuyến nghị rollout:
1) Migrate `concept/painting/background-swap` trước (ít ràng buộc).
2) Sau khi pass chất lượng, migrate dần các mode khó (baby/ultrasound/architecture/upscale).
3) Giữ cờ fallback về Gemini cho từng mode trong giai đoạn đầu.

---

## 8) Danh sách file đã phân tích trực tiếp

- `/root/.openclaw/workspace/magic-nhc/App.tsx`
- `/root/.openclaw/workspace/magic-nhc/services/geminiService.ts`
- `/root/.openclaw/workspace/magic-nhc/components/ControlPanel.tsx`
- `/root/.openclaw/workspace/magic-nhc/types.ts`
- `/root/.openclaw/workspace/magic-nhc/constants.ts`
- `/root/.openclaw/workspace/magic-nhc/index.tsx`
- `/root/.openclaw/workspace/magic-nhc/vite.config.ts`
- `/root/.openclaw/workspace/magic-nhc/package.json`
- `/root/.openclaw/workspace/magic-nhc/metadata.json`

Tham chiếu API/pattern:
- `/root/.openclaw/workspace/magic-tool/API_REVIEW.md`
- `/root/.openclaw/workspace/magic-tool/FIX_SUMMARY.md`
- `/root/.openclaw/workspace/magic-tool/PlaygroundModal.tsx`
