
export interface VoiceOption {
  id: string;
  name: string;
}

export interface ErrorDetails {
  title: string;
  message: string;
  suggestions: string[];
}

export interface HistoryItem {
  id:string;
  text: string;
  voice: string;
  speed: number;
}

export interface SrtEntry {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

export enum WeatherOption {
  NONE = "Không",
  LIGHT_SUN = "Nắng nhẹ",
  HARSH_SUN = "Nắng gắt",
  SUNSET = "Hoàng hôn",
  NIGHT = "Ban đêm",
  FOG = "Sương mù"
}

export type ModelType = 'flash' | 'pro-image' | 'nano-pro';
export type ShotType = 'half-body' | 'close-up' | 'none';

export type PrintLayoutType = '4x6' | '3x4' | '2x3' | 'mixed';

export interface GenerationSettings {
    userPrompt: string;
    referenceImage: File | null;
    referenceImagePreview: string | null;
    lightingEffects: string[];
    weather: WeatherOption;
    blurAmount: number;
    minimalCustomization: boolean;
    originalImageCompatibility: boolean;
    preservePose: boolean;
    preserveComposition: boolean;
    preserveFocalLength: boolean;
    preserveAspectRatio: boolean;
    disableForeground: boolean;
    preserveSubjectPosition: boolean;
    keepOriginalOutfit: boolean;
    subjectMatchSceneColor: boolean;
    sceneMatchSubjectColor: boolean;
    enableUpscale: boolean;
    restorationCustomPrompt: string;
    modelType: ModelType;
    imageSize: '1K' | '2K' | '4K' | '5K';
    aspectRatio: 'auto' | '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
    isPortraitFocus?: boolean;
    shotType: ShotType;
    straightenIntensity?: number; // Cường độ căn chỉnh
    lifestyleTheme?: string; // Chủ đề sống ảo
    mockupTheme?: string; // Chủ đề Mockup thiết kế
    lightTheme?: string; // Chủ đề hiệu ứng ánh sáng
    lightIntensity?: number; // Cường độ ánh sáng
    creativeEffect?: string; // Hiệu ứng sáng tạo
    effectIntensity?: number; // Cường độ hiệu ứng
    symmetryIntensity?: number; // Cường độ cân đối
    balanceMode?: 'facial' | 'body' | 'full'; // Chế độ cân đối
    babyGender?: 'nam' | 'nu' | 'ngau-nhien'; // Giới tính em bé
    babyStyle?: 'realistic' | 'ultrasound'; // Phong cách ảnh em bé
    babyPredictMode?: 'parents' | 'ultrasound'; // Chế độ dự đoán em bé
    ultrasoundTask?: 'predict-face' | 'clarify'; // Nhiệm vụ siêu âm
    babyFacialDetailIntensity?: number; // Cường độ bám sát chi tiết khuôn mặt
    babyStrictFeatures?: boolean; // Phục dựng bám sát mắt, mũi, miệng
    archStyle?: string; // Phong cách kiến trúc
    archType?: 'interior' | 'exterior'; // Loại kiến trúc
    upscaleIntensity?: number; // Cường độ làm nét
    expandDirection?: 'all' | 'horizontal' | 'vertical' | 'left' | 'right' | 'top' | 'bottom' | 'none'; // Hướng mở rộng
    removeBackgroundMode?: 'remove-bg' | 'remove-object' | 'clean-bg'; // Chế độ xóa nền/vật thể
    cleanBgIntensity?: number; // Cường độ làm sạch
    cleanBgRemoveDetails?: boolean; // Tẩy chi tiết thừa
    cleanBgEvenColor?: boolean; // Làm đều màu phông
    cleanBgReduceNoise?: boolean; // Giảm noise
    cleanBgSharpen?: boolean; // Tăng độ nét phông
    cleanBgCustomPrompt?: string; // Tùy chỉnh thêm cho làm sạch nền
    preserveFace?: boolean; // Bảo toàn nét mặt
    // Painting Features
    paintingStyle?: string;
    paintingQualityEnhance?: boolean;
    // New Restoration Features
    restoHairDetail?: boolean;
    restoClothingDetail?: boolean;
    restoAsianBlackHair?: boolean;
    restoUpscaleVr2?: boolean;
    restoRealEsrgan?: boolean;
    restoAdvancedNhc?: boolean;
    restoSuperPortrait?: boolean;
    restoQualityEnhance?: boolean;
    restoEnableAdvanced?: boolean;
    customApiKey?: string;
}

export interface ProfileSettings {
    gender: 'nam' | 'nu';
    subject: 'nguoi-lon' | 'thanh-nien' | 'tre-em';
    attire: string;
    hairstyle: string;
    hairColor: string;
    background: string;
    aspectRatio: string;
    customBackgroundColor: string | null;
    beautifyLevel: number;
    customPrompt: string;
    customAttireImage: File | null;
    customAttirePreview: string | null;
    enableUpscale: boolean;
}

export interface StoredImage {
    id: string;
    url: string;
    timestamp: number;
}

export type ViewMode = 'home' | 'concept' | 'restoration' | 'voice' | 'profile' | 'clothing' | 'painting' | 'background-swap' | 'face-straighten' | 'lifestyle' | 'mockup' | 'lighting-effects' | 'remove-background' | 'symmetric-edit' | 'baby-ultrasound' | 'architecture-render' | 'upscale-expand';

export interface ProcessedImage {
  id: string;
  originalPreviewUrl: string;
  file?: File;
  generatedImageUrl?: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
  error?: string;
  isSelected: boolean;
}
