import { GenerationSettings } from '../types';

const TRAM_BASE_URL = 'https://api.tramsangtao.com';
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 180000;

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
  modelType === 'nano-pro' ? 'nano-banana-pro' : 'nano-banana';

const getApiKey = (settings: GenerationSettings) => {
  const envKey =
    typeof globalThis !== 'undefined' &&
    (globalThis as any).process?.env?.TRAMSANGTAO_API_KEY
      ? String((globalThis as any).process.env.TRAMSANGTAO_API_KEY)
      : undefined;

  const key = settings.tstApiKey?.trim() || envKey;
  if (!key) throw new Error('Thiếu API Key Trạm Sáng Tạo.');
  return key;
};

const extractJobId = (data: any): string | null =>
  data?.job_id || data?.jobId || data?.data?.job_id || data?.data?.jobId || null;

const extractStatus = (data: any): string => String(data?.status || data?.data?.status || '').toLowerCase();

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
  form.append('model', modelFromTier(settings.modelType));
  form.append('resolution', normalizeResolution(settings.imageSize));
  form.append('aspect_ratio', normalizeAspectRatio(settings.aspectRatio));

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

  const startedAt = Date.now();
  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS);

    const pollRes = await fetch(`${TRAM_BASE_URL}/v1/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!pollRes.ok) {
      const text = await pollRes.text().catch(() => '');
      throw new Error(`Lỗi kiểm tra job (${pollRes.status}): ${text}`);
    }

    const pollPayload = await pollRes.json();
    const status = extractStatus(pollPayload);

    if (SUCCESS_STATUSES.has(status)) {
      const resultUrl = extractResultUrl(pollPayload);
      if (!resultUrl) throw new Error('Job hoàn tất nhưng thiếu URL ảnh kết quả.');
      return toDataUrl(resultUrl);
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
