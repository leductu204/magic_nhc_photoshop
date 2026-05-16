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

const buildSymmetricPrompt = (settings: GenerationSettings) => {
  const symInstructions: string[] = [];
  if (settings.symHairSmoothEnable) symInstructions.push(`- Smooth and reflow hair texture (Intensity: ${settings.symHairSmooth}).`);
  if (settings.symEyeDistanceEnable) symInstructions.push(`- Adjust eye distance for balance (Intensity: ${settings.symEyeDistance}).`);
  if (settings.symEyeSizeEnable) symInstructions.push(`- Balance eye size horizontally and vertically (Intensity: ${settings.symEyeSize}).`);
  if (settings.symEyeLazyEnable) symInstructions.push(`- Correct lazy eye or drooping eyelids (Intensity: ${settings.symEyeLazy}).`);
  if (settings.symNoseShrinkEnable) symInstructions.push(`- Refine and slim nostrils (Intensity: ${settings.symNoseShrink}).`);
  if (settings.symNoseStraightenEnable) symInstructions.push(`- Straighten nasal bridge (Intensity: ${settings.symNoseStraighten}).`);
  if (settings.symNoseLiftEnable) symInstructions.push(`- Slightly lift the nose tip (Intensity: ${settings.symNoseLift}).`);
  if (settings.symMouthAlignEnable) symInstructions.push(`- Align mouth position and balance lips (Intensity: ${settings.symMouthAlign}).`);
  if (settings.symMouthTeethEnable) symInstructions.push(`- Refine teeth visibility and gum line (Intensity: ${settings.symMouthTeeth}).`);
  if (settings.symMouthWrinklesEnable) symInstructions.push(`- Remove lip wrinkles and smooth texture (Intensity: ${settings.symMouthWrinkles}).`);
  if (settings.symJawSlimEnable) symInstructions.push(`- Slim and refine jawline contour (Intensity: ${settings.symJawSlim}).`);
  if (settings.symChinVLineEnable) symInstructions.push(`- Sculpt V-line chin profile (Intensity: ${settings.symChinVLine}).`);
  if (settings.symLegSlimEnable) symInstructions.push(`- Slim leg proportions naturally (Intensity: ${settings.symLegSlim}).`);
  if (settings.symLegLengthenEnable) symInstructions.push(`- Extend leg length proportional to height (Intensity: ${settings.symLegLengthen}).`);
  if (settings.symArmSlimEnable) symInstructions.push(`- Slim arm contours (Intensity: ${settings.symArmSlim}).`);
  if (settings.symArmLengthenEnable) symInstructions.push(`- Extend arm length naturally (Intensity: ${settings.symArmLengthen}).`);

  return {
    ...settings,
    userPrompt: `
AI structural balance and proportional symmetry.
Mode: ${settings.balanceMode || 'full'}.
Overall intensity: ${settings.symmetryIntensity || 0.8}/1.0.
Specific adjustments:
${symInstructions.length ? symInstructions.join('\n') : '- Balance facial features, body posture, and natural proportions.'}
${settings.userPrompt?.trim() ? `Custom instruction: ${settings.userPrompt.trim()}` : ''}
Keep identity, age, expression, skin texture, clothing, and camera perspective natural. Avoid over-retouching or uncanny symmetry.
`.trim(),
  };
};

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

  const genSettings = {
    modelType: (settings as any).modelType || 'pro-image',
    userPrompt: prompt,
    customApiKey: (settings as any).customApiKey || '',
    imageSize: (settings as any).imageSize || '2K',
    aspectRatio: '1:1',
  } as GenerationSettings;

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
  return generateWithTramSangTao([file], buildSymmetricPrompt(settings));
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
