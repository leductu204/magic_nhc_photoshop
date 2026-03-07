# AUDIT REPORT — magic-nhc tier refactor

Date: 2026-03-07
Auditor: OpenClaw subagent

## Scope checked
- `services/tramSangTaoService.ts` (new)
- `services/imageGenerationService.ts` (new)
- `App.tsx` (updated)
- `components/ControlPanel.tsx` (updated)
- `types.ts` (updated)
- `constants.ts` (updated)
- Project-wide grep for: `pro-image`, `5K`, `customApiKey`, `flash` (as model type)
- TypeScript check: `npm run lint` (tsc --noEmit)

---

## Findings

### 1) **Medium** — Browser-runtime safety issue when reading env var in TST service
- **File + line:** `services/tramSangTaoService.ts:29`
- **What was wrong:**
  - Code directly accessed `process.env.TRAMSANGTAO_API_KEY` in frontend runtime path.
  - In browser builds, `process` may be undefined depending on bundler/polyfill behavior, causing runtime failure.
- **Fix applied:**
  - Switched to safe lookup via `globalThis` + optional chaining, with trimmed `settings.tstApiKey` priority.

```ts
const envKey =
  typeof globalThis !== 'undefined' &&
  (globalThis as any).process?.env?.TRAMSANGTAO_API_KEY
    ? String((globalThis as any).process.env.TRAMSANGTAO_API_KEY)
    : undefined;

const key = settings.tstApiKey?.trim() || envKey;
```

- **Status:** ✅ Fixed in code.

---

### 2) **Low** — Job id extractor missed one common nested variant (`data.jobId`)
- **File + line:** `services/tramSangTaoService.ts:40`
- **What was wrong:**
  - `extractJobId` handled `job_id`, `jobId`, `data.job_id` but not `data.jobId`.
  - Could fail if API responds camelCase nested field.
- **Fix applied:**

```ts
const extractJobId = (data: any): string | null =>
  data?.job_id || data?.jobId || data?.data?.job_id || data?.data?.jobId || null;
```

- **Status:** ✅ Fixed in code.

---

## Verification checklist (requested items)

### `services/tramSangTaoService.ts`
- Auth header format: ✅ `Authorization: Bearer <key>`
- Multipart upload for `input_image`: ✅ uses `FormData` and appends repeated `input_image`
- Poll interval: ✅ `POLL_INTERVAL_MS = 5000`
- Error handling: ✅ non-2xx generate/poll/balance throw with status + payload text

### `services/imageGenerationService.ts`
- Routing free→Gemini, nano/nano-pro→TST: ✅
  - `useTram = modelType === 'nano' || modelType === 'nano-pro'`
  - all image-generation wrappers route consistently

### `App.tsx`
- Broken refs to old tiers (`pro-image`, `flash`, `customApiKey`): ✅ none found in app logic
- Missing state variables/props (tier migration): ✅ none found
- TST API key load from localStorage: ✅ implemented
  - storage key constant: `tst_api_key`
  - load on mount and sync across settings states

### `components/ControlPanel.tsx`
- Resolution only for nano-pro: ✅ conditional render is correct
- API key input visibility logic: ✅ shown for nano + nano-pro, hidden for free
- Old tier remnants: ✅ none in tier/UI logic

### `types.ts`
- Leftover old types: ✅ none
  - `ModelType = 'free' | 'nano' | 'nano-pro'`
  - `imageSize = '1K' | '2K' | '4K'`

### Global grep for old identifiers
- `pro-image`: ❌ only in docs/plans, not runtime code
- `5K`: ❌ only in docs/plans
- `customApiKey`: ❌ only in docs/plans
- `flash` as model type: ❌ none in tier type usage
  - Note: string `flash` still exists in Gemini **model names** (expected, not tier type)

---

## TypeScript status
- Ran: `npm run lint` (`tsc --noEmit`)
- Result: ✅ Pass (no TypeScript errors)

---

## Files modified during audit
- `services/tramSangTaoService.ts`
  - Safe env key access in browser runtime
  - Expanded `extractJobId` compatibility
