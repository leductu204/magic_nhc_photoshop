import { GenerationSettings } from '../types';

const TRAM_BASE_URL = '/tst-api';
const TRAM_DIRECT_URL = 'https://api.tramsangtao.com';
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 1200000;

const SUCCESS_STATUSES = new Set(['completed', 'succeeded', 'success', 'done', 'finished']);
const FAILURE_STATUSES = new Set(['failed', 'error', 'cancelled', 'canceled']);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeResolution = (size?: string): '1k' | '2k' | '4k' => {
  if (!size) return '2k';
  const lower = size.toLowerCase();
  if (lower === '1k') return '1k';
  if (lower === '4k') return '4k';
  return '2k';
};

const normalizeAspectRatio = (ratio?: string) => {
  if (!ratio || ratio === 'auto') return '1:1';
  return ratio;
};

const modelFromTier = (modelType: GenerationSettings['modelType']) =>
  modelType === 'pro-image' ? 'nano-banana-pro' : 'nano-banana';

const getApiKey = (settings: GenerationSettings) => {
  const envKey =
    typeof globalThis !== 'undefined' &&
    (globalThis as any).process?.env?.TRAMSANGTAO_API_KEY
      ? String((globalThis as any).process.env.TRAMSANGTAO_API_KEY)
      : undefined;

  const key = settings.customApiKey?.trim() || envKey;
  if (!key) throw new Error('Thiếu API Key Trạm Sáng Tạo.');
  return key;
};

const extractJobId = (data: any): string | null =>
  data?.job_id || data?.jobId || data?.data?.job_id || data?.data?.jobId || null;

const extractStatus = (data: any): string => String(data?.status || data?.data?.status || '').toLowerCase();

const uploadImageFile = async (file: File, apiKey: string): Promise<string> => {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${TRAM_DIRECT_URL}/v1/files/upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload ảnh thất bại (${res.status}): ${text}`);
  }

  const payload = await res.json();
  const url = payload?.url || payload?.data?.url;
  if (!url) throw new Error('Upload thành công nhưng không nhận được URL.');
  return url;
};

const extractResultUrl = (data: any): string | null => {
  const candidates = [
    data?.result,
    data?.url,
    data?.image,
    data?.data?.result,
    data?.data?.url,
    data?.data?.image,
    data?.images?.[0],
    data?.data?.images?.[0],
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.startsWith('http')) return candidate;
  }
  return null;
};

const toDataUrl = async (url: string): Promise<string> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Không tải được ảnh kết quả (${res.status}).`);
  const blob = await res.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generateWithTramSangTao = async (
  inputImages: File[] | undefined,
  settings: GenerationSettings
): Promise<string> => {
  const apiKey = getApiKey(settings);

  const form = new FormData();
  form.append('prompt', (settings.userPrompt || 'Generate image').trim());

  const model = modelFromTier(settings.modelType);
  form.append('model', model);

  // nano-banana không hỗ trợ resolution, chỉ nano-banana-pro mới có
  if (model === 'nano-banana-pro') {
    form.append('resolution', normalizeResolution(settings.imageSize));
  }

  form.append('aspect_ratio', normalizeAspectRatio(settings.aspectRatio));
  form.append('speed', 'fast');
  form.append('server_id', 'vip1');

  if (inputImages?.length) {
    inputImages.forEach((file) => form.append('input_image', file));
  }

  const genRes = await fetch(`${TRAM_BASE_URL}/v1/image/generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!genRes.ok) {
    const text = await genRes.text().catch(() => '');
    throw new Error(`Tạo ảnh thất bại (${genRes.status}): ${text}`);
  }

  const genPayload = await genRes.json();
  const jobId = extractJobId(genPayload);
  if (!jobId) throw new Error('Không nhận được job_id từ Trạm Sáng Tạo.');

  return pollAndReturn(jobId, apiKey);
};

const pollAndReturn = async (jobId: string, apiKey: string): Promise<string> => {
  const MAX_POLL_RETRIES = 3;
  const POLL_BACKOFF_MS = [2000, 4000, 8000];
  const DEFAULT_RETRY_AFTER_MS = 5000;

  const parseRetryAfterMs = (value: string | null): number => {
    if (!value) return DEFAULT_RETRY_AFTER_MS;
    const seconds = Number(value);
    if (!Number.isNaN(seconds) && seconds >= 0) return Math.max(0, Math.floor(seconds * 1000));
    const dateMs = Date.parse(value);
    if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());
    return DEFAULT_RETRY_AFTER_MS;
  };

  const startedAt = Date.now();
  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS);

    let pollRes: Response | null = null;

    for (let retry = 0; retry <= MAX_POLL_RETRIES; retry++) {
      try {
        pollRes = await fetch(`${TRAM_BASE_URL}/v1/jobs/${jobId}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${apiKey}` },
        });
      } catch (error: any) {
        if (retry < MAX_POLL_RETRIES) {
          const waitMs = POLL_BACKOFF_MS[retry] ?? POLL_BACKOFF_MS[POLL_BACKOFF_MS.length - 1];
          console.warn(`[TramSangTao] Poll job ${jobId} network error. Retry ${retry + 1}/${MAX_POLL_RETRIES} sau ${waitMs}ms.`, error);
          await sleep(waitMs);
          continue;
        }
        throw new Error(error?.message || 'Lỗi mạng khi kiểm tra job.');
      }

      if (pollRes.ok) break;

      const statusCode = pollRes.status;
      const text = await pollRes.text().catch(() => '');

      if (statusCode === 429) {
        if (retry < MAX_POLL_RETRIES) {
          const waitMs = parseRetryAfterMs(pollRes.headers.get('retry-after'));
          console.warn(`[TramSangTao] Poll job ${jobId} bị rate limit (429). Retry ${retry + 1}/${MAX_POLL_RETRIES} sau ${waitMs}ms.`);
          await sleep(waitMs);
          continue;
        }
        throw new Error(`Lỗi kiểm tra job (${statusCode}): ${text}`);
      }

      if (statusCode >= 500) {
        if (retry < MAX_POLL_RETRIES) {
          const waitMs = POLL_BACKOFF_MS[retry] ?? POLL_BACKOFF_MS[POLL_BACKOFF_MS.length - 1];
          console.warn(`[TramSangTao] Poll job ${jobId} lỗi server (${statusCode}). Retry ${retry + 1}/${MAX_POLL_RETRIES} sau ${waitMs}ms.`);
          await sleep(waitMs);
          continue;
        }
        throw new Error(`Lỗi kiểm tra job (${statusCode}): ${text}`);
      }

      throw new Error(`Lỗi kiểm tra job (${statusCode}): ${text}`);
    }

    if (!pollRes || !pollRes.ok) throw new Error('Không thể kiểm tra trạng thái job.');

    const pollPayload = await pollRes.json();
    const status = extractStatus(pollPayload);

    if (SUCCESS_STATUSES.has(status)) {
      const resultUrl = extractResultUrl(pollPayload);
      if (!resultUrl) throw new Error('Job hoàn tất nhưng thiếu URL ảnh kết quả.');
      return resultUrl;
    }

    if (FAILURE_STATUSES.has(status)) {
      throw new Error(pollPayload?.error || pollPayload?.message || 'Job thất bại.');
    }
  }

  throw new Error('Timeout khi chờ Trạm Sáng Tạo xử lý ảnh.');
};

export const getTramSangTaoBalance = async (apiKey: string): Promise<number> => {
  const res = await fetch(`${TRAM_BASE_URL}/v1/balance`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Không lấy được số dư (${res.status}): ${text}`);
  }

  const payload = await res.json();
  return Number(payload?.balance || 0);
};
