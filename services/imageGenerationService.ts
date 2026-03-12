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
  settings.modelType === 'nano' || settings.modelType === 'pro-image';

const buildPrompt = (settings: GenerationSettings, fallback: string) => ({
  ...settings,
  userPrompt: settings.userPrompt?.trim() || fallback,
});

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

export { generateProfileImage };
