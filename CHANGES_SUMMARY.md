# CHANGES SUMMARY

## Đã thực hiện theo REFACTOR_PLAN + yêu cầu bổ sung

### 1) Cập nhật tier thành 3 gói mới
- **Miễn phí** → `modelType: 'free'`
- **Nano** → `modelType: 'nano'`
- **Nano Pro** → `modelType: 'nano-pro'`

Đã đổi tại:
- `types.ts`: `ModelType` từ `'flash' | 'pro-image' | 'nano-pro'` -> `'free' | 'nano' | 'nano-pro'`
- `App.tsx`: default `modelType` -> `'free'`
- `components/ControlPanel.tsx`: tab chọn gói đổi thành Miễn Phí / Nano / Nano Pro

---

### 2) Xóa hoàn toàn “Bản Pro” và bỏ 5K
Đã xử lý:
- Loại bỏ mọi nhánh `pro-image`
- Loại bỏ `imageSize` 5K khỏi type và UI

Chi tiết:
- `types.ts`: `imageSize` đổi từ `'1K' | '2K' | '4K' | '5K'` -> `'1K' | '2K' | '4K'`
- `ControlPanel.tsx`: danh sách kích thước chỉ còn `1K, 2K, 4K`
- `geminiService.ts`: bỏ logic/nhánh xử lý 5K cũ trong flow generate

---

### 3) Resolution selector chỉ hiện cho Nano Pro
Đã cập nhật trong `ControlPanel.tsx`:
- Khối chọn kích thước chỉ render khi `settings.modelType === 'nano-pro'`
- Với `free` và `nano`: ẩn hoàn toàn selector độ phân giải

---

### 4) Thêm API Key Trạm Sáng Tạo + localStorage
Đã triển khai:
- Thêm field setting mới: `tstApiKey?: string` trong `types.ts`
- Đổi input key ở `ControlPanel.tsx`:
  - Label/placeholder theo Trạm Sáng Tạo
  - bind vào `settings.tstApiKey`
- `App.tsx`:
  - Key localStorage: `tst_api_key`
  - auto-load key lúc app start và apply cho toàn bộ settings state
  - auto-save khi key thay đổi
  - đồng bộ key qua các view/settings khi user sửa key ở bất kỳ view nào
- Input key chỉ hiện trong khối paid tier (`nano`/`nano-pro`), ẩn khi `free`

---

### 5) Tích hợp Trạm Sáng Tạo API
Đã tạo file mới:
- `services/tramSangTaoService.ts`

Có các phần chính:
- Base URL: `https://api.tramsangtao.com`
- Generate: `POST /v1/image/generate`
  - `Authorization: Bearer <tst_api_key>`
  - gửi `FormData` với fields:
    - `prompt`
    - `model` (`nano-banana` hoặc `nano-banana-pro`)
    - `resolution` (`1k|2k|4k`)
    - `aspect_ratio`
    - `input_image` (1 hoặc nhiều file)
- Poll: `GET /v1/jobs/{job_id}` mỗi **3 giây** đến khi completed/failed
- Parse status/result theo kiểu robust
- Convert URL kết quả -> data URL để tương thích flow hiện tại
- Balance endpoint: `getTramSangTaoBalance()` gọi `GET /v1/balance`

---

### 6) Router service theo tier (Gemini vs Trạm)
Đã tạo thêm:
- `services/imageGenerationService.ts`

Logic:
- Nếu tier `free` -> gọi lại các hàm Gemini cũ (giữ nguyên logic cũ)
- Nếu tier `nano` hoặc `nano-pro` -> route qua Trạm Sáng Tạo (`generateWithTramSangTao`)

Áp dụng cho các mode generate chính:
- styled / background-swap / painting
- face-straighten / lifestyle / mockup / lighting
- remove-background / symmetric-edit
- baby prediction / architecture / upscale-expand
- profile vẫn export dùng từ Gemini như cũ

---

### 7) App wiring
Đã đổi import trong `App.tsx`:
- Các hàm ảnh chuyển từ `./services/geminiService` -> `./services/imageGenerationService`
- Các hàm text/voice/phân tích khác vẫn giữ ở `geminiService`

---

### 8) Cập nhật env expose
`vite.config.ts` đã thêm:
- `process.env.TRAMSANGTAO_API_KEY`

Giữ lại:
- `process.env.GEMINI_API_KEY`

---

## Ghi chú
- Đã đọc tài liệu tham chiếu yêu cầu:
  - `/root/.openclaw/workspace/magic-tool/API_REVIEW.md`
  - `/root/.openclaw/workspace/magic-tool/FIX_SUMMARY.md`
- Đã đọc các file được yêu cầu trước khi sửa:
  - `App.tsx`, `services/geminiService.ts`, `components/ControlPanel.tsx`, `types.ts`, `constants.ts`

## Trạng thái build
- Chưa thể chạy `vite build` trong môi trường hiện tại vì thiếu binary `vite` (command not found), nhưng code refactor theo yêu cầu đã được áp trực tiếp vào source.
