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
} from './geminiService';
import { generateWithTramSangTao } from './tramSangTaoService';

const useTram = (settings: GenerationSettings) =>
  settings.modelType === 'nano' || settings.modelType === 'pro-image';

const buildPrompt = (settings: GenerationSettings, fallback: string) => ({
  ...settings,
  userPrompt: settings.userPrompt?.trim() || fallback,
});

export async function generateProfileImage(file: File, settings: ProfileSettings) {
  // Profile luôn qua tramSangTao
  const { gender, subject, attire, hairstyle, hairColor, background, beautifyLevel, customPrompt, customBackgroundColor, customAttireImage } = settings;

  const finalBackground = background === 'TÙY CHỈNH' && customBackgroundColor
    ? `Solid background with color: ${customBackgroundColor}`
    : `${background} background`;

  const attireDesc = attire === 'TÙY CHỈNH' && customAttireImage
    ? 'Use clothing from the provided attire reference image.'
    : attire;

  const prompt = `Professional AI profile photo. IDENTITY LOCK: preserve face 100%. Gender: ${gender === 'nam' ? 'Male' : 'Female'}. Age: ${subject === 'nguoi-lon' ? 'Adult' : subject === 'thanh-nien' ? 'Youth' : 'Child'}. Clothing: ${attireDesc}. Hairstyle: ${hairstyle}. Hair color: ${hairColor}. Background: ${finalBackground}. Skin beautification: level ${beautifyLevel}/100. Studio headshot, cinematic lighting. ${customPrompt || ''}`.trim();

  const images: File[] = [file];
  if (customAttireImage) images.push(customAttireImage);

  const genSettings: GenerationSettings = {
    modelType: (settings as any).modelType || 'pro-image',
    userPrompt: prompt,
    customApiKey: (settings as any).customApiKey || '',
    imageSize: '2K',
    aspectRatio: '1:1',
  };

  return generateWithTramSangTao(images, genSettings);
}

export async function generateStyledImage(file: File, settings: GenerationSettings) {
  if (!useTram(settings)) return generateStyledImageGemini(file, settings);
  return generateWithTramSangTao([file], buildPrompt(settings, 'Chỉnh sửa ảnh theo mô tả người dùng'));
}

export async function generateBackgroundSwapImage(file: File, settings: GenerationSettings) {
  if (!useTram(settings)) return generateBackgroundSwapImageGemini(file, settings);
  const images = [file, ...(settings.referenceImage ? [settings.referenceImage] : [])];
  return generateWithTramSangTao(images, buildPrompt(settings, 'Thay nền ảnh theo mô tả người dùng'));
}

export async function generatePaintingImage(file: File, settings: GenerationSettings) {
  if (!useTram(settings)) return generatePaintingImageGemini(file, settings);
  const images = [file, ...(settings.referenceImage ? [settings.referenceImage] : [])];
  return generateWithTramSangTao(images, buildPrompt(settings, 'Chuyển ảnh thành phong cách hội họa'));
}

export async function generateFaceStraightenImage(file: File, settings: GenerationSettings) {
  if (!useTram(settings)) return generateFaceStraightenImageGemini(file, settings);
  return generateWithTramSangTao([file], buildPrompt(settings, 'Căn chỉnh khuôn mặt thẳng tự nhiên, giữ nguyên danh tính'));
}

export async function generateLifestyleImage(file: File, settings: GenerationSettings) {
  if (!useTram(settings)) return generateLifestyleImageGemini(file, settings);
  return generateWithTramSangTao([file], buildPrompt(settings, 'Tạo ảnh lifestyle theo chủ đề yêu cầu'));
}

export async function generateMockupImage(file: File, settings: GenerationSettings) {
  if (!useTram(settings)) return generateMockupImageGemini(file, settings);
  return generateWithTramSangTao([file], buildPrompt(settings, 'Tạo mockup sản phẩm theo mô tả'));
}

export async function generateLightingEffectImage(file: File, settings: GenerationSettings) {
  if (!useTram(settings)) return generateLightingEffectImageGemini(file, settings);
  return generateWithTramSangTao([file], buildPrompt(settings, 'Áp dụng hiệu ứng ánh sáng theo yêu cầu'));
}

export async function generateRemoveBackgroundImage(file: File, settings: GenerationSettings) {
  if (!useTram(settings)) return generateRemoveBackgroundImageGemini(file, settings);
  return generateWithTramSangTao([file], buildPrompt(settings, 'Tách nền hoặc xóa vật thể theo yêu cầu'));
}

export async function generateSymmetricEditImage(file: File, settings: GenerationSettings) {
  if (!useTram(settings)) return generateSymmetricEditImageGemini(file, settings);
  return generateWithTramSangTao([file], buildPrompt(settings, 'Chỉnh sửa cân đối cơ thể và tỉ lệ tự nhiên'));
}

export async function generateBabyUltrasoundImage(fatherFile: File, motherFile: File, settings: GenerationSettings) {
  if (!useTram(settings)) return generateBabyUltrasoundImageGemini(fatherFile, motherFile, settings);
  return generateWithTramSangTao([fatherFile, motherFile], buildPrompt(settings, 'Dự đoán khuôn mặt em bé từ ảnh cha mẹ'));
}

export async function generateBabyFromUltrasoundImage(ultrasoundFile: File, settings: GenerationSettings) {
  if (!useTram(settings)) return generateBabyFromUltrasoundImageGemini(ultrasoundFile, settings);
  return generateWithTramSangTao([ultrasoundFile], buildPrompt(settings, 'Làm rõ ảnh siêu âm và dự đoán khuôn mặt em bé'));
}

export async function generateArchitectureRenderImage(file: File, settings: GenerationSettings) {
  if (!useTram(settings)) return generateArchitectureRenderImageGemini(file, settings);
  return generateWithTramSangTao([file], buildPrompt(settings, 'Render kiến trúc theo phong cách yêu cầu'));
}

export async function generateUpscaleExpandImage(file: File, settings: GenerationSettings) {
  if (!useTram(settings)) return generateUpscaleExpandImageGemini(file, settings);
  return generateWithTramSangTao([file], buildPrompt(settings, 'Nâng cấp độ nét và mở rộng ảnh'));
}
