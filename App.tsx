
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateSpeech, translateText, preprocessClothImage, analyzeImageText, generateClothingSwap, fileToPart, refineClothingResult, analyzeRestorationImage } from './services/geminiService';
import { generateStyledImage, generateProfileImage, generatePaintingImage, generateBackgroundSwapImage, generateFaceStraightenImage, generateLifestyleImage, generateMockupImage, generateLightingEffectImage, generateRemoveBackgroundImage, generateSymmetricEditImage, generateBabyUltrasoundImage, generateArchitectureRenderImage, generateBabyFromUltrasoundImage, generateUpscaleExpandImage } from './services/imageGenerationService';
import { generateWithTramSangTao } from './services/tramSangTaoService';
import { pcmToWavBlob, decodeAudioData, decode, stitchAudioBuffers } from './utils/audioUtils';
import { splitTextIntoChunks } from './utils/textUtils';
import { AVAILABLE_VOICES, HISTORY_STORAGE_KEY, MAX_HISTORY_ITEMS } from './constants';
import { ErrorDetails, HistoryItem, ViewMode, ProcessedImage, GenerationSettings, WeatherOption, StoredImage, ProfileSettings, ModelType, PrintLayoutType } from './types';
import { initDB, saveImageToGallery, getGalleryImages, deleteGalleryImage } from './services/galleryService';
import { Part } from "@google/genai";

// UI Components
import VoiceSelector from './components/VoiceSelector';
import TextAreaInput from './components/TextAreaInput';
import GenerateButton from './components/GenerateButton';
import ProgressBar from './components/ProgressBar';
import AudioPlayer from './components/AudioPlayer';
import ErrorMessage from './components/ErrorMessage';
import SpeedControl from './components/SpeedControl';
import SrtUploader from './components/SrtUploader';
import HistoryPanel from './components/HistoryPanel';
import DonationModal from './components/DonationModal';
import TranslatorPanel from './components/TranslatorPanel';
import VisitorCounter from './components/VisitorCounter';
import ControlPanel from './components/ControlPanel';
import ImageCard from './components/ImageCard';
import CropperModal from './components/CropperModal';
import DrawingModal from './components/DrawingModal';
import Lightbox from './components/Lightbox';
import ConfirmationModal from './components/ConfirmationModal';
import RulesModal from './components/RulesModal';

import { ArrowUpTrayIcon, ArrowDownTrayIcon, ArrowLeftIcon, PhotoIcon, XMarkIcon, SparklesIcon, ScissorsIcon, PlusIcon, TrashIcon, ArrowPathIcon, CheckIcon, PlayCircleIcon, FaceSmileIcon, SpeakerWaveIcon, PaintBrushIcon, ClockIcon, UserCircleIcon, ShoppingBagIcon, SwatchIcon, Squares2X2Icon, ViewColumnsIcon, ChevronLeftIcon, ChevronRightIcon, ComputerDesktopIcon, AdjustmentsHorizontalIcon, SquaresPlusIcon, PencilIcon, ShieldCheckIcon, ChevronUpIcon, ChevronDownIcon, LockClosedIcon, UserIcon, ShieldExclamationIcon, FingerPrintIcon, MapPinIcon, RocketLaunchIcon, PresentationChartBarIcon, SunIcon, ScaleIcon, HeartIcon, HomeModernIcon, PrinterIcon, ArrowRightOnRectangleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const CUSTOM_API_KEY_STORAGE_KEY = 'custom_api_key';

const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
    userPrompt: '',
    blurAmount: 2.8,
    weather: WeatherOption.NONE,
    lightingEffects: [],
    preserveSubjectPosition: true,
    preservePose: true,
    preserveComposition: true,
    preserveFocalLength: true,
    preserveAspectRatio: true,
    disableForeground: false,
    originalImageCompatibility: true,
    keepOriginalOutfit: true,
    subjectMatchSceneColor: true,
    sceneMatchSubjectColor: true,
    enableUpscale: false,
    restorationCustomPrompt: '',
    minimalCustomization: false,
    referenceImage: null,
    referenceImagePreview: null,
    modelType: 'nano' as ModelType,
    imageSize: '2K' as '1K' | '2K' | '4K',
    aspectRatio: 'auto',
    isPortraitFocus: false,
    shotType: 'none',
    straightenIntensity: 1.0,
    removeBackgroundMode: 'remove-bg',
    cleanBgIntensity: 0.85,
    cleanBgRemoveDetails: true,
    cleanBgEvenColor: true,
    cleanBgReduceNoise: true,
    cleanBgSharpen: true,
    cleanBgCustomPrompt: '',
    lifestyleTheme: 'Paris Travel',
    mockupTheme: 'Store Shelf',
    lightTheme: 'Studio Soft',
    lightIntensity: 0.8,
    symmetryIntensity: 0.8,
    balanceMode: 'full',
    // Fix: babyGender should have a specific default value from the union type.
    babyGender: 'ngau-nhien',
    babyStyle: 'realistic',
    babyPredictMode: 'parents',
    ultrasoundTask: 'predict-face',
    babyFacialDetailIntensity: 0.8,
    babyStrictFeatures: false,
    archStyle: 'Modern',
    archType: 'interior',
    upscaleIntensity: 0.8,
    expandDirection: 'all',
    preserveFace: true,
    creativeEffect: '',
    effectIntensity: 0.5,
    paintingStyle: 'Oil Painting',
    paintingQualityEnhance: false,
    restoHairDetail: false,
    restoClothingDetail: false,
    restoAsianBlackHair: false,
    restoUpscaleVr2: false,
    restoRealEsrgan: false,
    restoAdvancedNhc: false,
    restoSuperPortrait: false,
    restoQualityEnhance: false,
    restoEnableAdvanced: true
};

const TOOLS = [
    {
        id: 'restoration',
        title: 'PHỤC CHẾ ẢNH CŨ',
        desc: 'Khôi phục màu & chi tiết',
        icon: ClockIcon,
        color: 'green',
        gradient: 'from-green-900/40 to-teal-900/40',
        border: 'border-green-500/30',
        hoverBorder: 'hover:border-green-400',
        text: 'text-green-400',
        subText: 'text-blue-200/60',
        shadow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]'
    },
    {
        id: 'profile',
        title: 'ẢNH HỒ SƠ AI',
        desc: 'Tạo ảnh thẻ & CV chuyên nghiệp',
        icon: UserCircleIcon,
        color: 'pink',
        gradient: 'from-pink-900/40 to-rose-900/40',
        border: 'border-pink-500/30',
        hoverBorder: 'hover:border-pink-400',
        text: 'text-pink-400',
        subText: 'text-blue-200/60',
        shadow: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]'
    },
    {
        id: 'background-swap',
        title: 'THAY NỀN AI',
        desc: 'Đổi bối cảnh chuyên nghiệp',
        icon: PhotoIcon,
        color: 'teal',
        gradient: 'from-teal-900/40 to-emerald-900/40',
        border: 'border-teal-500/30',
        hoverBorder: 'hover:border-teal-400',
        text: 'text-teal-400',
        subText: 'text-blue-200/60',
        shadow: 'hover:shadow-[0_0_30px_rgba(20,184,166,0.3)]'
    },
    {
        id: 'remove-background',
        title: 'XÓA NỀN AI',
        desc: 'Tách chủ thể & làm sạch nền',
        icon: ScissorsIcon,
        color: 'indigo',
        gradient: 'from-indigo-900/40 to-blue-900/40',
        border: 'border-indigo-500/30',
        hoverBorder: 'hover:border-indigo-400',
        text: 'text-indigo-400',
        subText: 'text-blue-200/60',
        shadow: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]'
    },
    {
        id: 'upscale-expand',
        title: 'LÀM NÉT & MỞ RỘNG ẢNH',
        desc: 'Nâng cấp độ phân giải & Outpainting',
        icon: SquaresPlusIcon,
        color: 'blue',
        gradient: 'from-blue-900/40 to-indigo-900/40',
        border: 'border-blue-500/30',
        hoverBorder: 'hover:border-blue-400',
        text: 'text-blue-400',
        subText: 'text-blue-200/60',
        shadow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]'
    },
    {
        id: 'baby-ultrasound',
        title: 'DỰ ĐOÁN EM BÉ AI',
        desc: 'Phân tích & mô phỏng mặt con',
        icon: HeartIcon,
        color: 'pink',
        gradient: 'from-pink-900/40 to-rose-900/40',
        border: 'border-pink-500/30',
        hoverBorder: 'hover:border-pink-400',
        text: 'text-pink-400',
        subText: 'text-blue-200/60',
        shadow: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]'
    },
    {
        id: 'face-straighten',
        title: 'CĂN CHỈNH THẲNG MẶT AI',
        desc: 'Cân bằng trục & đối xứng mặt',
        icon: UserIcon,
        color: 'yellow',
        gradient: 'from-yellow-900/40 to-orange-900/40',
        border: 'border-yellow-500/30',
        hoverBorder: 'hover:border-yellow-400',
        text: 'text-yellow-400',
        subText: 'text-blue-200/60',
        shadow: 'hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]'
    },
    {
        id: 'clothing',
        title: 'THAY TRANG PHỤC AI',
        desc: 'Ghép trang phục tham chiếu',
        icon: ShoppingBagIcon,
        color: 'indigo',
        gradient: 'from-indigo-900/40 to-violet-900/40',
        border: 'border-indigo-500/30',
        hoverBorder: 'hover:border-indigo-400',
        text: 'text-indigo-400',
        subText: 'text-blue-200/60',
        shadow: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]'
    },
    {
        id: 'symmetric-edit',
        title: 'CHỈNH SỬA CÂN ĐỐI AI',
        desc: 'Cân bằng tỉ lệ & đối xứng cơ thể',
        icon: ScaleIcon,
        color: 'violet',
        gradient: 'from-violet-900/40 to-purple-900/40',
        border: 'border-violet-500/30',
        hoverBorder: 'hover:border-violet-400',
        text: 'text-violet-400',
        subText: 'text-blue-200/60',
        shadow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]'
    },
    {
        id: 'mockup',
        title: 'MOCKUP THIẾT KẾ BÁN HÀNG',
        desc: 'Ghép thiết kế vào môi trường thực tế',
        icon: PresentationChartBarIcon,
        color: 'amber',
        gradient: 'from-amber-900/40 to-orange-900/40',
        border: 'border-amber-500/30',
        hoverBorder: 'hover:border-amber-400',
        text: 'text-amber-400',
        subText: 'text-blue-200/60',
        shadow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]'
    },
    {
        id: 'lifestyle',
        title: 'TẠO ẢNH SỐNG ẢO AI',
        desc: 'Ghép ảnh du lịch & lifestyle sang chảnh',
        icon: MapPinIcon,
        color: 'emerald',
        gradient: 'from-emerald-900/40 to-green-900/40',
        border: 'border-emerald-500/30',
        hoverBorder: 'hover:border-emerald-400',
        text: 'text-emerald-400',
        subText: 'text-blue-200/60',
        shadow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]'
    },
    {
        id: 'lighting-effects',
        title: 'HIỆU ƯNG ÁNH SÁNG AI',
        desc: 'Tạo ánh sáng chuyên nghiệp & nghệ thuật',
        icon: SunIcon,
        color: 'orange',
        gradient: 'from-orange-900/40 to-red-900/40',
        border: 'border-orange-500/30',
        hoverBorder: 'hover:border-orange-400',
        text: 'text-orange-400',
        subText: 'text-blue-200/60',
        shadow: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]'
    },
    {
        id: 'concept',
        title: 'FAKE CONCEPT AI',
        desc: 'Ghép ảnh, ánh sáng & style',
        icon: PaintBrushIcon,
        color: 'blue',
        gradient: 'from-blue-900/40 to-purple-900/40',
        border: 'border-blue-500/30',
        hoverBorder: 'hover:border-blue-400',
        text: 'text-blue-400',
        subText: 'text-blue-200/60',
        shadow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]'
    },
    {
        id: 'painting',
        title: 'TRANH VẼ NGHỆ THUẬT AI',
        desc: 'Chuyển ảnh thành tranh nghệ thuật',
        icon: SwatchIcon,
        color: 'violet',
        gradient: 'from-violet-900/40 to-fuchsia-900/40',
        border: 'border-violet-500/30',
        hoverBorder: 'hover:border-violet-400',
        text: 'text-violet-400',
        subText: 'text-blue-200/60',
        shadow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]'
    },
    {
        id: 'architecture-render',
        title: 'RENDER 3D KIẾN TRÚC',
        desc: 'Chuyển ảnh/sketch thành render 3D',
        icon: HomeModernIcon,
        color: 'cyan',
        gradient: 'from-cyan-900/40 to-blue-900/40',
        border: 'border-cyan-500/30',
        hoverBorder: 'hover:border-cyan-400',
        text: 'text-cyan-400',
        subText: 'text-blue-200/60',
        shadow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]'
    },
    {
        id: 'voice',
        title: 'GIỌNG ĐỌC AI',
        desc: 'Chuyển đổi văn bản thành giọng nói',
        icon: SpeakerWaveIcon,
        color: 'red',
        gradient: 'from-red-900/40 to-orange-900/40',
        border: 'border-red-500/30',
        hoverBorder: 'hover:border-red-400',
        text: 'text-red-400',
        subText: 'text-blue-200/60',
        shadow: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]'
    }
];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginForm, setLoginForm] = useState({ tfa: '' });
  const [showTfa, setShowTfa] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [homeDisplayMode, setHomeDisplayMode] = useState<'grid' | 'carousel'>('carousel');
  const [isDonationModalOpen, setIsDonationModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDownloadAllModalOpen, setIsDownloadAllModalOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);

  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  const _s = (arr: number[]) => arr.map(c => String.fromCharCode(c)).join('');
  const _v = (val: string) => val === _s([78, 72, 67]);

  const [conceptImages, setConceptImages] = useState<ProcessedImage[]>([]);
  const [conceptSettings, setConceptSettings] = useState<GenerationSettings>({ 
      ...DEFAULT_GENERATION_SETTINGS,
      userPrompt: 'Tạo một concept nghệ thuật độc đáo cho ảnh này, giữ nguyên thần thái của chủ thể nhưng thay đổi bối cảnh sang phong cách Cyberpunk rực rỡ.'
  });

  const [backgroundSwapImages, setBackgroundSwapImages] = useState<ProcessedImage[]>([]);
  const [backgroundSwapSettings, setBackgroundSwapSettings] = useState<GenerationSettings>({ ...DEFAULT_GENERATION_SETTINGS });

  const [restorationImages, setRestorationImages] = useState<ProcessedImage[]>([]);
  const [restorationSettings, setRestorationSettings] = useState<GenerationSettings>({ 
      ...DEFAULT_GENERATION_SETTINGS, 
      userPrompt: `Phục chế tấm ảnh cũ này với chất lượng cao: xóa vết trầy xước, bụi, vết bẩn, nếp gấp, phục hồi các vùng bị mờ, chỉnh sáng và độ tương phản, làm nét các chi tiết trên khuôn mặt, tăng cường màu sắc tự nhiên, giữ nguyên kết cấu gốc, giữ tông da chân thực, không làm da quá mịn giả.
{
  "caption": "Phục chế & nâng cấp ảnh cũ – giữ background gốc, màu điện ảnh, chuẩn Phase One XF IQ4 150MP",
  "notes": "Biến ảnh cũ (kể cả ảnh chụp lại) thành ảnh màu hiện đại, sạch tuyệt đối, giữ background gốc nhưng nâng cấp đẳng cấp như chụp mới. Ưu tiên bảo toàn danh tính và pose.",
  "camera_emulation": {
    "brand_model": "Phase One XF IQ4 150MP",
    "medium_format": true,
    "look": "ultimate sharpness, maximum dynamic range, cinematic rendering"
  },
  "subject_constraints": { "keep_identity": true, "expression_policy": "preserve_original" },
  "retouching": { "skin": { "texture": "retain fine pores; avoid plastic look" }, "repair_cracks": "strict", "remove_dust_scratches": "strict" },
  "colorization": { "style": "cinematic, natural, true-to-life" },
  "clean_up": { "reconstruct_missing_parts": "museum-grade" }
}`,
      minimalCustomization: true,
      originalImageCompatibility: true,
  });
  const [isAnalyzingRestoration, setIsAnalyzingRestoration] = useState(false);

  const [profileImages, setProfileImages] = useState<ProcessedImage[]>([]);
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
      gender: 'nu',
      subject: 'nguoi-lon',
      attire: 'SƠ MI',
      hairstyle: 'GỌN GÀNG',
      hairColor: 'Đen',
      background: 'XANH',
      aspectRatio: 'original',
      customBackgroundColor: null,
      beautifyLevel: 0,
      customPrompt: '',
      customAttireImage: null,
      customAttirePreview: null,
      enableUpscale: false
  });
  const [printLayout, setPrintLayout] = useState<PrintLayoutType>('4x6');

  const [faceStraightenImages, setFaceStraightenImages] = useState<ProcessedImage[]>([]);
  const [faceStraightenSettings, setFaceStraightenSettings] = useState<GenerationSettings>({ ...DEFAULT_GENERATION_SETTINGS, straightenIntensity: 1.0 });

  const [lifestyleImages, setLifestyleImages] = useState<ProcessedImage[]>([]);
  const [lifestyleSettings, setLifestyleSettings] = useState<GenerationSettings>({ ...DEFAULT_GENERATION_SETTINGS, lifestyleTheme: 'Paris Travel' });
  
  const [mockupImages, setMockupImages] = useState<ProcessedImage[]>([]);
  const [mockupSettings, setMockupSettings] = useState<GenerationSettings>({ ...DEFAULT_GENERATION_SETTINGS, mockupTheme: 'Store Shelf' });

  const [lightingEffectImages, setLightingEffectImages] = useState<ProcessedImage[]>([]);
  const [lightingEffectSettings, setLightingEffectSettings] = useState<GenerationSettings>({ ...DEFAULT_GENERATION_SETTINGS, lightTheme: 'Studio Soft', lightIntensity: 0.8 });

  const [removeBackgroundImages, setRemoveBackgroundImages] = useState<ProcessedImage[]>([]);
  const [removeBackgroundSettings, setRemoveBackgroundSettings] = useState<GenerationSettings>({ ...DEFAULT_GENERATION_SETTINGS });

  const [symmetricEditImages, setSymmetricEditImages] = useState<ProcessedImage[]>([]);
  const [symmetricEditSettings, setSymmetricEditSettings] = useState<GenerationSettings>({ ...DEFAULT_GENERATION_SETTINGS, symmetryIntensity: 0.8, balanceMode: 'full' });

  const [babyUltrasoundImages, setBabyUltrasoundImages] = useState<ProcessedImage[]>([]);
  const [babyUltrasoundSettings, setBabyUltrasoundSettings] = useState<GenerationSettings>({ ...DEFAULT_GENERATION_SETTINGS, babyGender: 'ngau-nhien', babyStyle: 'realistic', babyPredictMode: 'parents', ultrasoundTask: 'predict-face', babyFacialDetailIntensity: 0.8, babyStrictFeatures: false });
  const [babyFather, setBabyFather] = useState<{file: File, url: string} | null>(null);
  const [babyMother, setBabyMother] = useState<{file: File, url: string} | null>(null);
  const [babyUltrasoundFile, setBabyUltrasoundFile] = useState<{file: File, url: string} | null>(null);

  const [architectureImages, setArchitectureImages] = useState<ProcessedImage[]>([]);
  const [architectureSettings, setArchitectureSettings] = useState<GenerationSettings>({ ...DEFAULT_GENERATION_SETTINGS, archStyle: 'Modern', archType: 'interior' });

  const [upscaleExpandImages, setUpscaleExpandImages] = useState<ProcessedImage[]>([]);
  const [upscaleExpandSettings, setUpscaleExpandSettings] = useState<GenerationSettings>({ ...DEFAULT_GENERATION_SETTINGS, upscaleIntensity: 0.8, expandDirection: 'all' });

  const [clothingPerson, setClothingPerson] = useState<{file: File, part: Part | null, url: string} | null>(null);
  const [clothingCloth, setClothingCloth] = useState<{file: File, part: Part | null, url: string, isProcessing: boolean, isProcessed?: boolean} | null>(null);
  const [clothingBg, setClothingBg] = useState<{file: File, part: Part | null, url: string, description: string | null, isProcessing: boolean} | null>(null);
  const [clothingPose, setClothingPose] = useState<{file: File, part: Part | null, url: string, description: string | null, isProcessing: boolean} | null>(null);
  const [clothingResultUrl, setClothingResultUrl] = useState<string | null>(null);
  const [clothingResultPart, setClothingResultPart] = useState<Part | null>(null);
  const [clothingCustomPrompt, setClothingCustomPrompt] = useState<string>('Giữ nguyên khuôn mặt và biểu cảm tự nhiên của chủ thể');
  const [clothingAspectRatio, setClothingAspectRatio] = useState<string>('auto');
  const [clothingEnableUpscale, setClothingEnableUpscale] = useState<boolean>(true);
  const [isClothingProcessing, setIsClothingProcessing] = useState<boolean>(false);
  const [clothingRefinePrompt, setClothingRefinePrompt] = useState<string>('');
  const [showClothingRefine, setShowClothingRefine] = useState<boolean>(false);

  const [paintingImages, setPaintingImages] = useState<ProcessedImage[]>([]);
  const [paintingSettings, setPaintingSettings] = useState<GenerationSettings>({ 
      ...DEFAULT_GENERATION_SETTINGS,
      paintingStyle: 'Oil Painting',
      paintingQualityEnhance: true,
      userPrompt: 'Chuyển ảnh này thành một bức tranh sơn dầu nghệ thuật, giữ nguyên bố cục và thần thái của chủ thể.'
  });

  const [galleryItems, setGalleryItems] = useState<StoredImage[]>([]);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<File | null>(null);
  const [imageIdToCrop, setImageIdToCrop] = useState<string | null>(null);
  const [showDrawing, setShowDrawing] = useState(false);
  const [imageToDraw, setImageToDraw] = useState<File | null>(null);
  const [imageIdToDraw, setImageIdToDraw] = useState<string | null>(null);
  const [lightboxData, setLightboxData] = useState<{ src: string; originalSrc: string } | null>(null);

  const [voiceText, setVoiceText] = useState<string>('Xin chào...');
  const [selectedVoice, setSelectedVoice] = useState<string>(AVAILABLE_VOICES[0].id);
  const [isVoiceLoading, setIsVoiceLoading] = useState<boolean>(false);
  const [voiceProgress, setVoiceProgress] = useState<number>(0);
  const [audioData, setAudioData] = useState<{ url: string; blob: Blob } | null>(null);
  const [isVoiceCompleted, setIsVoiceCompleted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [voiceHistory, setVoiceHistory] = useState<HistoryItem[]>([]);
  const [voiceError, setVoiceError] = useState<ErrorDetails | null>(null);
  const [translatorInput, setTranslatorInput] = useState<string>('');
  const [translatorOutput, setTranslatorOutput] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translatorError, setTranslatorError] = useState<ErrorDetails | null>(null);

  const images = (() => {
      switch (viewMode) {
          case 'concept': return conceptImages;
          case 'background-swap': return backgroundSwapImages;
          case 'restoration': return restorationImages;
          case 'profile': return profileImages;
          case 'painting': return paintingImages;
          case 'face-straighten': return faceStraightenImages;
          case 'lifestyle': return lifestyleImages;
          case 'mockup': return mockupImages;
          case 'lighting-effects': return lightingEffectImages;
          case 'remove-background': return removeBackgroundImages;
          case 'symmetric-edit': return symmetricEditImages;
          case 'baby-ultrasound': return babyUltrasoundImages;
          case 'architecture-render': return architectureImages;
          case 'upscale-expand': return upscaleExpandImages;
          default: return [];
      }
  })();

  const setImages = (action: React.SetStateAction<ProcessedImage[]>) => {
      switch (viewMode) {
          case 'concept': setConceptImages(action); break;
          case 'background-swap': setBackgroundSwapImages(action); break;
          case 'restoration': setRestorationImages(action); break;
          case 'profile': setProfileImages(action); break;
          case 'painting': setPaintingImages(action); break;
          case 'face-straighten': setFaceStraightenImages(action); break;
          case 'lifestyle': setLifestyleImages(action); break;
          case 'mockup': setMockupImages(action); break;
          case 'lighting-effects': setLightingEffectImages(action); break;
          case 'remove-background': setRemoveBackgroundImages(action); break;
          case 'symmetric-edit': setSymmetricEditImages(action); break;
          case 'baby-ultrasound': setBabyUltrasoundImages(action); break;
          case 'architecture-render': setArchitectureImages(action); break;
          case 'upscale-expand': setUpscaleExpandImages(action); break;
      }
  };

  const imageSettings = (() => {
      if (viewMode === 'restoration') return restorationSettings;
      if (viewMode === 'painting') return paintingSettings;
      if (viewMode === 'background-swap') return backgroundSwapSettings;
      if (viewMode === 'face-straighten') return faceStraightenSettings;
      if (viewMode === 'lifestyle') return lifestyleSettings;
      if (viewMode === 'mockup') return mockupSettings;
      if (viewMode === 'lighting-effects') return lightingEffectSettings;
      if (viewMode === 'remove-background') return removeBackgroundSettings;
      if (viewMode === 'symmetric-edit') return symmetricEditSettings;
      if (viewMode === 'baby-ultrasound') return babyUltrasoundSettings;
      if (viewMode === 'architecture-render') return architectureSettings;
      if (viewMode === 'upscale-expand') return upscaleExpandSettings;
      return conceptSettings;
  })();

  const setImageSettings = (newSettings: Partial<GenerationSettings>) => {
      if (newSettings.customApiKey !== undefined) {
          const syncTstKey = (prev: GenerationSettings): GenerationSettings => ({ ...prev, customApiKey: newSettings.customApiKey });
          setConceptSettings(syncTstKey);
          setRestorationSettings(syncTstKey);
          setBackgroundSwapSettings(syncTstKey);
          setFaceStraightenSettings(syncTstKey);
          setLifestyleSettings(syncTstKey);
          setMockupSettings(syncTstKey);
          setLightingEffectSettings(syncTstKey);
          setRemoveBackgroundSettings(syncTstKey);
          setSymmetricEditSettings(syncTstKey);
          setBabyUltrasoundSettings(syncTstKey);
          setArchitectureSettings(syncTstKey);
          setUpscaleExpandSettings(syncTstKey);
          setPaintingSettings(syncTstKey);
      }

      if (viewMode === 'restoration') {
          setRestorationSettings(prev => ({ ...prev, ...newSettings }));
      } else if (viewMode === 'painting') {
          setPaintingSettings(prev => ({ ...prev, ...newSettings }));
      } else if (viewMode === 'background-swap') {
          setBackgroundSwapSettings(prev => ({ ...prev, ...newSettings }));
      } else if (viewMode === 'face-straighten') {
          setFaceStraightenSettings(prev => ({ ...prev, ...newSettings }));
      } else if (viewMode === 'lifestyle') {
          setLifestyleSettings(prev => ({ ...prev, ...newSettings }));
      } else if (viewMode === 'mockup') {
          setMockupSettings(prev => ({ ...prev, ...newSettings }));
      } else if (viewMode === 'lighting-effects') {
          setLightingEffectSettings(prev => ({ ...prev, ...newSettings }));
      } else if (viewMode === 'remove-background') {
          setRemoveBackgroundSettings(prev => ({ ...prev, ...newSettings }));
      } else if (viewMode === 'symmetric-edit') {
          setSymmetricEditSettings(prev => ({ ...prev, ...newSettings }));
      } else if (viewMode === 'baby-ultrasound') {
          setBabyUltrasoundSettings(prev => ({ ...prev, ...newSettings }));
      } else if (viewMode === 'architecture-render') {
          setArchitectureSettings(prev => ({ ...prev, ...newSettings }));
      } else if (viewMode === 'upscale-expand') {
          setUpscaleExpandSettings(prev => ({ ...prev, ...newSettings }));
      } else {
          setConceptSettings(prev => ({ ...prev, ...newSettings }));
      }
  };

  useEffect(() => {
    const sessionToken = localStorage.getItem('NHC_SESS_TOKEN');
    if (sessionToken === 'VERIFIED_VIP') setIsLoggedIn(true);
    
    const savedTFA = localStorage.getItem('NHC_REMEMBERED_TFA');
    
    if (savedTFA) {
        setLoginForm({
            tfa: savedTFA
        });
        setRememberMe(true);
    }

    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) setVoiceHistory(JSON.parse(storedHistory));
    } catch (e) {}

    const savedTstApiKey = localStorage.getItem(CUSTOM_API_KEY_STORAGE_KEY) || '';
    if (savedTstApiKey) {
      const applySavedKey = (prev: GenerationSettings): GenerationSettings => ({ ...prev, customApiKey: savedTstApiKey });
      setConceptSettings(applySavedKey);
      setRestorationSettings(applySavedKey);
      setBackgroundSwapSettings(applySavedKey);
      setFaceStraightenSettings(applySavedKey);
      setLifestyleSettings(applySavedKey);
      setMockupSettings(applySavedKey);
      setLightingEffectSettings(applySavedKey);
      setRemoveBackgroundSettings(applySavedKey);
      setSymmetricEditSettings(applySavedKey);
      setBabyUltrasoundSettings(applySavedKey);
      setArchitectureSettings(applySavedKey);
      setUpscaleExpandSettings(applySavedKey);
      setPaintingSettings(applySavedKey);
    }
    const loadGallery = async () => {
        try {
            await initDB();
            const items = await getGalleryImages();
            setGalleryItems(items.filter(i => (Date.now() - i.timestamp) < 259200000));
        } catch (e) {}
    };
    loadGallery();
  }, []);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(voiceHistory));
  }, [voiceHistory]);

  useEffect(() => {
    const key = imageSettings.customApiKey?.trim() || '';
    if (key) localStorage.setItem(CUSTOM_API_KEY_STORAGE_KEY, key);
    else localStorage.removeItem(CUSTOM_API_KEY_STORAGE_KEY);
  }, [imageSettings.customApiKey]);

  useEffect(() => {
    if (viewMode !== 'home') {
      const index = TOOLS.findIndex(t => t.id === viewMode);
      if (index !== -1) {
        setActiveCarouselIndex(index);
      }
    }
  }, [viewMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        
        if (!isInput) {
            setPressedKey(e.key);
        }

        if (e.key.toLowerCase() === 'f' && !isInput) {
            e.preventDefault();
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
        }
        if (isLoggedIn && !isInput) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (viewMode === 'home') {
                    setActiveCarouselIndex(prev => (prev - 1 + TOOLS.length) % TOOLS.length);
                } else {
                    const currentIndex = TOOLS.findIndex(t => t.id === viewMode);
                    if (currentIndex !== -1) {
                        const nextIndex = (currentIndex - 1 + TOOLS.length) % TOOLS.length;
                        setViewMode(TOOLS[nextIndex].id as ViewMode);
                    }
                }
            }
            else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (viewMode === 'home') {
                    setActiveCarouselIndex(prev => (prev + 1) % TOOLS.length);
                } else {
                    const currentIndex = TOOLS.findIndex(t => t.id === viewMode);
                    if (currentIndex !== -1) {
                        const nextIndex = (currentIndex + 1) % TOOLS.length;
                        setViewMode(TOOLS[nextIndex].id as ViewMode);
                    }
                }
            }
            else if (e.key === 'Enter') {
                if (viewMode === 'home') {
                    e.preventDefault();
                    if (homeDisplayMode === 'carousel') {
                        setViewMode(TOOLS[activeCarouselIndex].id as ViewMode);
                    }
                }
            }
            else if (e.key === 'Escape' && viewMode !== 'home') {
                e.preventDefault();
                setViewMode('home');
            }
        }
    };

    const handleKeyUp = () => {
        setPressedKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [viewMode, homeDisplayMode, activeCarouselIndex, isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (_v(loginForm.tfa)) {
        setIsLoggedIn(true);
        if (rememberMe) {
            localStorage.setItem('NHC_SESS_TOKEN', 'VERIFIED_VIP');
            localStorage.setItem('NHC_REMEMBERED_TFA', loginForm.tfa);
        } else {
            localStorage.removeItem('NHC_REMEMBERED_TFA');
        }
    } else setLoginError('Mã xác thực không chính xác.');
  };

  const handleLogout = () => {
      localStorage.removeItem('NHC_SESS_TOKEN');
      setIsLoggedIn(false);
      setViewMode('home');
  };

  const handleImageUpload = (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
      if (files.length === 0) return;
      const isSingleMode = viewMode === 'profile' || viewMode === 'face-straighten' || viewMode === 'lifestyle' || viewMode === 'mockup' || viewMode === 'lighting-effects' || viewMode === 'remove-background' || viewMode === 'symmetric-edit' || viewMode === 'baby-ultrasound' || viewMode === 'architecture-render' || viewMode === 'upscale-expand';
      const defaultSelected = (viewMode === 'profile' || viewMode === 'restoration' || viewMode === 'face-straighten' || viewMode === 'lifestyle' || viewMode === 'mockup' || viewMode === 'lighting-effects' || viewMode === 'remove-background' || viewMode === 'symmetric-edit' || viewMode === 'baby-ultrasound' || viewMode === 'architecture-render' || viewMode === 'upscale-expand') ? true : false;
      const newImgs: ProcessedImage[] = files.map(file => ({
          id: crypto.randomUUID(),
          originalPreviewUrl: URL.createObjectURL(file),
          file: file,
          status: 'idle',
          isSelected: defaultSelected
      }));
      if (isSingleMode) setImages([newImgs[0]]); 
      else setImages(prev => [...prev, ...newImgs]); 
  };

  const generateSingleImage = async (file: File, id: string, isPortrait: boolean) => {
      setIsImageProcessing(true);
      setImages(prev => prev.map(p => p.id === id ? { ...p, status: 'generating', error: undefined } : p));
      
      try {
        let url = '';
        if (viewMode === 'profile') url = await generateProfileImage(file, { ...profileSettings, customApiKey: imageSettings.customApiKey, modelType: imageSettings.modelType, imageSize: imageSettings.imageSize } as any);
        else if (viewMode === 'painting') url = await generatePaintingImage(file, { ...paintingSettings, isPortraitFocus: isPortrait });
        else if (viewMode === 'background-swap') url = await generateBackgroundSwapImage(file, backgroundSwapSettings);
        else if (viewMode === 'face-straighten') url = await generateFaceStraightenImage(file, faceStraightenSettings);
        else if (viewMode === 'lifestyle') url = await generateLifestyleImage(file, lifestyleSettings);
        else if (viewMode === 'mockup') url = await generateMockupImage(file, mockupSettings);
        else if (viewMode === 'lighting-effects') url = await generateLightingEffectImage(file, lightingEffectSettings);
        else if (viewMode === 'remove-background') url = await generateRemoveBackgroundImage(file, removeBackgroundSettings);
        else if (viewMode === 'symmetric-edit') url = await generateSymmetricEditImage(file, symmetricEditSettings);
        else if (viewMode === 'baby-ultrasound') {
             if (babyUltrasoundSettings.babyPredictMode === 'ultrasound') {
                 if (!babyUltrasoundFile) throw new Error("Vui lòng tải ảnh siêu âm.");
                 url = await generateBabyFromUltrasoundImage(babyUltrasoundFile.file, babyUltrasoundSettings);
             } else {
                 if (!babyFather || !babyMother) throw new Error("Vui lòng tải ảnh Cha và Mẹ.");
                 url = await generateBabyUltrasoundImage(babyFather.file, babyMother.file, babyUltrasoundSettings);
             }
        }
        else if (viewMode === 'architecture-render') url = await generateArchitectureRenderImage(file, architectureSettings);
        else if (viewMode === 'upscale-expand') url = await generateUpscaleExpandImage(file, upscaleExpandSettings);
        else url = await generateStyledImage(file, { ...imageSettings, isPortraitFocus: isPortrait });

        setImages(prev => prev.map(p => p.id === id ? { ...p, status: 'completed', generatedImageUrl: url } : p));
        const newItem: StoredImage = { id: crypto.randomUUID(), url, timestamp: Date.now() };
        await saveImageToGallery(newItem);
        setGalleryItems(prev => [newItem, ...prev]);
      } catch (e: any) {
        setImages(prev => prev.map(p => p.id === id ? { ...p, status: 'error', error: e.message || 'Lỗi tạo ảnh' } : p));
      } finally { setIsImageProcessing(false); }
  };

  const handleRegenerateImage = async (item: ProcessedImage) => {
     if (item.status === 'generating') return;
     let file = item.file;
     if (!file) {
        const resp = await fetch(item.originalPreviewUrl);
        file = new File([await resp.blob()], "retry.jpg", { type: 'image/jpeg' });
     }
     generateSingleImage(file, item.id, item.isSelected);
  };

  const handleRefineRestoration = async () => {
        if (viewMode !== 'restoration' && viewMode !== 'face-straighten' && viewMode !== 'lifestyle' && viewMode !== 'mockup' && viewMode !== 'lighting-effects' && viewMode !== 'remove-background' && viewMode !== 'symmetric-edit' && viewMode !== 'baby-ultrasound' && viewMode !== 'architecture-render' && viewMode !== 'profile' && viewMode !== 'background-swap' && viewMode !== 'upscale-expand' && viewMode !== 'painting' && viewMode !== 'concept') return;
        
        const currentImageList = 
            viewMode === 'restoration' ? restorationImages : 
            viewMode === 'face-straighten' ? faceStraightenImages : 
            viewMode === 'lifestyle' ? lifestyleImages : 
            viewMode === 'mockup' ? mockupImages : 
            viewMode === 'lighting-effects' ? lightingEffectImages : 
            viewMode === 'remove-background' ? removeBackgroundImages : 
            viewMode === 'baby-ultrasound' ? babyUltrasoundImages :
            viewMode === 'architecture-render' ? architectureImages :
            viewMode === 'profile' ? profileImages :
            viewMode === 'background-swap' ? backgroundSwapImages :
            viewMode === 'upscale-expand' ? upscaleExpandImages :
            viewMode === 'painting' ? paintingImages :
            viewMode === 'concept' ? images :
            symmetricEditImages;

        if (currentImageList.length === 0 && viewMode === 'baby-ultrasound') {
            await handleStartBabyPrediction();
            return;
        }

        const currentImage = currentImageList.find(img => img.isSelected) || currentImageList[currentImageList.length - 1];
        
        if (!currentImage?.generatedImageUrl && viewMode === 'baby-ultrasound') {
             await handleStartBabyPrediction();
             return;
        }

        if (!currentImage?.generatedImageUrl) {
            handleRegenerateImage(currentImage);
            return;
        }
        
        if (!currentImage && viewMode === 'profile') return;

        setIsImageProcessing(true);
        try {
            const blob = await (await fetch(currentImage.generatedImageUrl)).blob();
            const file = new File([blob], `refine_${Date.now()}.jpg`, { type: blob.type });
            const newId = crypto.randomUUID();
            
            const newImageObj: ProcessedImage = { id: newId, originalPreviewUrl: URL.createObjectURL(file), file, status: 'generating', isSelected: true };
            
            if (viewMode === 'restoration') {
                setRestorationImages(prev => [...prev.map(p => ({ ...p, isSelected: false })), newImageObj]);
                const url = await generateStyledImage(file, { ...restorationSettings, userPrompt: restorationSettings.restorationCustomPrompt, isPortraitFocus: true });
                setRestorationImages(prev => prev.map(img => img.id === newId ? { ...img, status: 'completed', generatedImageUrl: url } : img));
            } else if (viewMode === 'profile') {
                setProfileImages([newImageObj]);
                const url = await generateProfileImage(file, { ...profileSettings, customApiKey: imageSettings.customApiKey, modelType: imageSettings.modelType, imageSize: imageSettings.imageSize } as any);
                setProfileImages(prev => prev.map(img => img.id === newId ? { ...img, status: 'completed', generatedImageUrl: url } : img));
            } else if (viewMode === 'face-straighten') {
                setFaceStraightenImages(prev => [...prev.map(p => ({ ...p, isSelected: false })), newImageObj]);
                const url = await generateFaceStraightenImage(file, { ...faceStraightenSettings, straightenIntensity: faceStraightenSettings.straightenIntensity });
                setFaceStraightenImages(prev => prev.map(img => img.id === newId ? { ...img, status: 'completed', generatedImageUrl: url } : img));
            } else if (viewMode === 'lifestyle') {
                setLifestyleImages(prev => [...prev.map(p => ({ ...p, isSelected: false })), newImageObj]);
                const url = await generateLifestyleImage(file, { ...lifestyleSettings });
                setLifestyleImages(prev => prev.map(img => img.id === newId ? { ...img, status: 'completed', generatedImageUrl: url } : img));
            } else if (viewMode === 'mockup') {
                setMockupImages(prev => [...prev.map(p => ({ ...p, isSelected: false })), newImageObj]);
                const url = await generateMockupImage(file, { ...mockupSettings });
                setMockupImages(prev => prev.map(img => img.id === newId ? { ...img, status: 'completed', generatedImageUrl: url } : img));
            } else if (viewMode === 'lighting-effects') {
                setLightingEffectImages(prev => [...prev.map(p => ({ ...p, isSelected: false })), newImageObj]);
                const url = await generateLightingEffectImage(file, { ...lightingEffectSettings });
                setLightingEffectImages(prev => prev.map(img => img.id === newId ? { ...img, status: 'completed', generatedImageUrl: url } : img));
            } else if (viewMode === 'remove-background') {
                setRemoveBackgroundImages(prev => [...prev.map(p => ({ ...p, isSelected: false })), newImageObj]);
                const url = await generateRemoveBackgroundImage(file, { ...removeBackgroundSettings });
                setRemoveBackgroundImages(prev => prev.map(img => img.id === newId ? { ...img, status: 'completed', generatedImageUrl: url } : img));
            } else if (viewMode === 'baby-ultrasound') {
                setBabyUltrasoundImages(prev => [...prev.map(p => ({ ...p, isSelected: false })), newImageObj]);
                let url = '';
                if (babyUltrasoundSettings.babyPredictMode === 'ultrasound') {
                    if (!babyUltrasoundFile) throw new Error("Vui lòng tải ảnh siêu âm.");
                    url = await generateBabyFromUltrasoundImage(babyUltrasoundFile.file, babyUltrasoundSettings);
                } else {
                    if (!babyFather || !babyMother) throw new Error("Vui lòng tải ảnh Cha và Mẹ.");
                    url = await generateBabyUltrasoundImage(babyFather.file, babyMother.file, babyUltrasoundSettings);
                }
                setBabyUltrasoundImages(prev => prev.map(img => img.id === newId ? { ...img, status: 'completed', generatedImageUrl: url } : img));
            } else if (viewMode === 'architecture-render') {
                setArchitectureImages(prev => [...prev.map(p => ({ ...p, isSelected: false })), newImageObj]);
                const url = await generateArchitectureRenderImage(file, architectureSettings);
                setArchitectureImages(prev => prev.map(img => img.id === newId ? { ...img, status: 'completed', generatedImageUrl: url } : img));
            } else if (viewMode === 'upscale-expand') {
                setUpscaleExpandImages(prev => [...prev.map(p => ({ ...p, isSelected: false })), newImageObj]);
                const url = await generateUpscaleExpandImage(file, upscaleExpandSettings);
                setUpscaleExpandImages(prev => prev.map(img => img.id === newId ? { ...img, status: 'completed', generatedImageUrl: url } : img));
            } else if (viewMode === 'background-swap') {
                setBackgroundSwapImages(prev => [...prev.map(p => ({ ...p, isSelected: false })), newImageObj]);
                const url = await generateBackgroundSwapImage(file, backgroundSwapSettings);
                setBackgroundSwapImages(prev => prev.map(img => img.id === newId ? { ...img, status: 'completed', generatedImageUrl: url } : img));
            } else if (viewMode === 'painting') {
                setPaintingImages(prev => [...prev.map(p => ({ ...p, isSelected: false })), newImageObj]);
                const url = await generatePaintingImage(file, paintingSettings);
                setPaintingImages(prev => prev.map(img => img.id === newId ? { ...img, status: 'completed', generatedImageUrl: url } : img));
            } else if (viewMode === 'concept') {
                setImages(prev => [...prev.map(p => ({ ...p, isSelected: false })), newImageObj]);
                const url = await generateStyledImage(file, conceptSettings);
                setImages(prev => prev.map(img => img.id === newId ? { ...img, status: 'completed', generatedImageUrl: url } : img));
            } else {
                setSymmetricEditImages(prev => [...prev.map(p => ({ ...p, isSelected: false })), newImageObj]);
                const url = await generateSymmetricEditImage(file, { ...symmetricEditSettings });
                setSymmetricEditImages(prev => prev.map(img => img.id === newId ? { ...img, status: 'completed', generatedImageUrl: url } : img));
            }
        } catch (error: any) { alert("Lỗi xử lý: " + error.message); } finally { setIsImageProcessing(false); }
  };

  const handleStartBabyPrediction = async () => {
    setIsImageProcessing(true);
    const newId = crypto.randomUUID();
    const newImageObj: ProcessedImage = { 
        id: newId, 
        originalPreviewUrl: (babyUltrasoundSettings.babyPredictMode === 'ultrasound' ? babyUltrasoundFile?.url : babyFather?.url) || '', 
        status: 'generating', 
        isSelected: true 
    };
    
    setBabyUltrasoundImages(prev => [...prev.map(p => ({ ...p, isSelected: false })), newImageObj]);

    try {
        let url = '';
        if (babyUltrasoundSettings.babyPredictMode === 'ultrasound') {
            if (!babyUltrasoundFile) throw new Error("Vui lòng tải ảnh siêu âm.");
            url = await generateBabyFromUltrasoundImage(babyUltrasoundFile.file, babyUltrasoundSettings);
        } else {
            if (!babyFather || !babyMother) throw new Error("Vui lòng tải ảnh Cha và Mẹ.");
            url = await generateBabyUltrasoundImage(babyFather.file, babyMother.file, babyUltrasoundSettings);
        }
        
        setBabyUltrasoundImages(prev => prev.map(img => img.id === newId ? { ...img, status: 'completed', generatedImageUrl: url } : img));
        const newItem: StoredImage = { id: crypto.randomUUID(), url, timestamp: Date.now() };
        await saveImageToGallery(newItem);
        setGalleryItems(prev => [newItem, ...prev]);
    } catch (e: any) {
        setBabyUltrasoundImages(prev => prev.map(img => img.id === newId ? { ...img, status: 'error', error: e.message } : img));
    } finally {
        setIsImageProcessing(false);
    }
  };

  const handleAnalyzeRestoration = async () => {
      const currentImage = restorationImages.find(img => img.isSelected) || restorationImages[0];
      if (!currentImage) return;
      setIsAnalyzingRestoration(true);
      try {
          const res = await analyzeRestorationImage(currentImage.file || new File([await (await fetch(currentImage.originalPreviewUrl)).blob()], "tmp.jpg"));
          setRestorationSettings(prev => ({ ...prev, userPrompt: res }));
      } catch (e) {} finally { setIsAnalyzingRestoration(false); }
  };
  
  const handleSelectFromGallery = async (item: StoredImage) => {
      const resp = await fetch(item.url);
      handleImageUpload([new File([await resp.blob()], `gallery_${item.id}.jpg`, { type: 'image/jpeg' })]);
  };

  const handleDeleteFromGallery = async (id: string) => {
      try {
          await deleteGalleryImage(id);
          setGalleryItems(prev => prev.filter(item => item.id !== id));
      } catch (e) {
          console.error("Failed to delete from gallery:", e);
      }
  };

  const handleBabyPredictionUpload = (slot: 'father' | 'mother' | 'ultrasound', file: File) => {
      const url = URL.createObjectURL(file);
      if (slot === 'father') setBabyFather({ file, url });
      else if (slot === 'mother') setBabyMother({ file, url });
      else setBabyUltrasoundFile({ file, url });
  };

  const clearSingleImage = () => setImages([]);
  const openCropper = async (image: ProcessedImage) => {
      const url = (image.status === 'completed' && image.generatedImageUrl) ? image.generatedImageUrl : image.originalPreviewUrl;
      const resp = await fetch(url);
      setImageToCrop(new File([await resp.blob()], "crop.jpg", { type: 'image/jpeg' }));
      setImageIdToCrop(image.id);
      setShowCropper(true);
  };
  const handleCropSave = (f: File, p: string) => {
      if (!imageIdToCrop) return;
      setImages(prev => prev.map(img => img.id === imageIdToCrop ? { ...img, file: f, originalPreviewUrl: p, generatedImageUrl: undefined, status: 'idle' } : img));
  };
  const openDrawing = async (image: ProcessedImage) => {
      const url = (image.status === 'completed' && image.generatedImageUrl) ? image.generatedImageUrl : image.originalPreviewUrl;
      const resp = await fetch(url);
      setImageToDraw(new File([await resp.blob()], "draw.jpg", { type: 'image/jpeg' }));
      setImageIdToDraw(image.id);
      setShowDrawing(true);
  };
  const handleOpenDrawing = () => {
      const currentImageList = 
          viewMode === 'restoration' ? restorationImages : 
          viewMode === 'face-straighten' ? faceStraightenImages : 
          viewMode === 'lifestyle' ? lifestyleImages : 
          viewMode === 'mockup' ? mockupImages : 
          viewMode === 'lighting-effects' ? lightingEffectImages : 
          viewMode === 'remove-background' ? removeBackgroundImages : 
          viewMode === 'baby-ultrasound' ? babyUltrasoundImages :
          viewMode === 'architecture-render' ? architectureImages :
          viewMode === 'upscale-expand' ? upscaleExpandImages :
          viewMode === 'background-swap' ? backgroundSwapImages :
          viewMode === 'symmetric-edit' ? symmetricEditImages :
          images;

      const target = currentImageList.find(img => img.isSelected) || currentImageList[currentImageList.length - 1];
      
      if (target) {
          const url = (target.status === 'completed' && target.generatedImageUrl) ? target.generatedImageUrl : target.originalPreviewUrl;
          fetch(url).then(r => r.blob()).then(blob => {
              setImageToDraw(new File([blob], "draw.jpg", { type: 'image/jpeg' }));
              setImageIdToDraw(target.id);
              setShowDrawing(true);
          });
      }
  };

  const handleDrawingSave = (f: File, p: string) => {
      if (!imageIdToDraw) return;
      const updater = (prev: ProcessedImage[]) => prev.map(img => img.id === imageIdToDraw ? { ...img, file: f, originalPreviewUrl: p, generatedImageUrl: undefined, status: 'idle' } : img);
      
      if (viewMode === 'restoration') setRestorationImages(updater);
      else if (viewMode === 'face-straighten') setFaceStraightenImages(updater);
      else if (viewMode === 'lifestyle') setLifestyleImages(updater);
      else if (viewMode === 'mockup') setMockupImages(updater);
      else if (viewMode === 'lighting-effects') setLightingEffectImages(updater);
      else if (viewMode === 'remove-background') setRemoveBackgroundImages(updater);
      else if (viewMode === 'baby-ultrasound') setBabyUltrasoundImages(updater);
      else if (viewMode === 'architecture-render') setArchitectureImages(updater);
      else if (viewMode === 'upscale-expand') setUpscaleExpandImages(updater);
      else if (viewMode === 'background-swap') setBackgroundSwapImages(updater);
      else if (viewMode === 'symmetric-edit') setSymmetricEditImages(updater);
      else setImages(updater);
  };
  const openLightbox = (img: ProcessedImage) => setLightboxData({ src: img.generatedImageUrl || img.originalPreviewUrl, originalSrc: img.originalPreviewUrl });
  const handleDeleteAll = () => images.length > 0 && setIsDeleteModalOpen(true);
  const confirmDeleteAll = () => setImages([]);
  const handleDownloadAll = () => images.length > 0 && setIsDownloadAllModalOpen(true);
  const confirmDownloadAll = async () => {
      for (const img of images) {
          const url = img.generatedImageUrl || img.originalPreviewUrl;
          if (url) {
              const a = document.createElement('a'); a.href = url; a.download = `TOOL-MAGIC-NHC-PHOTOSHOP-VIPPRO -0828998995-${img.id}.png`; a.click();
              await new Promise(r => setTimeout(r, 300));
          }
      }
  };

  const handleDownloadPrintSheet = async (sourceUrl: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = sourceUrl;
      await new Promise(resolve => img.onload = resolve);

      const canvas = document.createElement('canvas');
      // A6 Paper at 300 DPI: ~1200 x 1800 px
      canvas.width = 1200;
      canvas.height = 1800;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const margin = 40;
      const spacing = 30;

      if (printLayout === '4x6') {
          // 4x6cm photo at 300 DPI is approx 472 x 709 px
          const w = 472, h = 709;
          for (let i = 0; i < 2; i++) {
              for (let j = 0; j < 2; j++) {
                  ctx.drawImage(img, margin + i * (w + spacing), margin + j * (h + spacing), w, h);
              }
          }
      } else if (printLayout === '3x4') {
          // 3x4cm photo is approx 354 x 472 px
          const w = 354, h = 472;
          for (let i = 0; i < 3; i++) {
              for (let j = 0; j < 3; j++) {
                  if (i * 3 + j < 8) {
                    ctx.drawImage(img, margin + i * (w + spacing), margin + j * (h + spacing), w, h);
                  }
              }
          }
      } else if (printLayout === '2x3') {
          // 2x3cm photo is approx 236 x 354 px
          const w = 236, h = 354;
          for (let i = 0; i < 4; i++) {
              for (let j = 0; j < 4; j++) {
                  if (i * 4 + j < 12) {
                    ctx.drawImage(img, margin + i * (w + spacing), margin + j * (h + spacing), w, h);
                  }
              }
          }
      } else {
          // Mixed layout
          ctx.drawImage(img, margin, margin, 472, 709); // 4x6
          ctx.drawImage(img, margin + 472 + spacing, margin, 472, 709); // 4x6
          ctx.drawImage(img, margin, margin + 709 + spacing, 354, 472); // 3x4
          ctx.drawImage(img, margin + 354 + spacing, margin + 709 + spacing, 354, 472); // 3x4
      }

      const link = document.createElement('a');
      link.download = `TOOL-MAGIC-NHC-PHOTOSHOP-VIPPRO -0828998995-${printLayout}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
  };

  const handleGenerateVoice = useCallback(async () => {
    setIsVoiceLoading(true); setVoiceProgress(0);
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const stitched = await generateFromText(audioContext);
      const blob = pcmToWavBlob(stitched.getChannelData(0), 24000);
      setAudioData({ url: URL.createObjectURL(blob), blob });
      setVoiceHistory(prev => [{ id: new Date().toISOString(), text: voiceText, voice: selectedVoice, speed: playbackRate }, ...prev].slice(0, MAX_HISTORY_ITEMS));
      setIsVoiceCompleted(true);
    } catch (err: any) { setVoiceError({ title: 'Lỗi', message: err.message, suggestions: [] }); }
    finally { setIsVoiceLoading(false); }
  }, [voiceText, selectedVoice, playbackRate]);

  const generateFromText = async (ctx: AudioContext) => {
      const chunks = splitTextIntoChunks(voiceText);
      const clips = []; let t = 0;
      for (let i = 0; i < chunks.length; i++) {
          const b64 = await generateSpeech(chunks[i], selectedVoice);
          setVoiceProgress(((i + 1) / chunks.length) * 100);
          if (b64) {
              const buf = await decodeAudioData(decode(b64), ctx, 24000, 1);
              clips.push({ buffer: buf, startTime: t }); t += buf.duration;
          }
      }
      return stitchAudioBuffers(clips, t, ctx);
  };

  const handleClothingFileUpload = async (slot: 'person' | 'cloth' | 'bg' | 'pose', file: File) => {
      const url = URL.createObjectURL(file);
      const part = await fileToPart(file);
      if (slot === 'person') setClothingPerson({ file, url, part });
      else if (slot === 'cloth') setClothingCloth({ file, url, part, isProcessing: false });
      else if (slot === 'bg') setClothingBg({ file, url, part, description: null, isProcessing: false });
      else if (slot === 'pose') setClothingPose({ file, url, part, description: null, isProcessing: false });
  };

  const generateSwap = async () => {
      setIsClothingProcessing(true);
      try {
          const images: File[] = [clothingPerson!.file, clothingCloth!.file];
          
          // Build prompt cho thay đồ
          let prompt = 'Virtual try-on: Take the clothing/outfit from the SECOND reference image and dress it onto the person in the FIRST reference image. The person must wear EXACTLY the same clothing item shown in the second image - same color, pattern, style, and design. Keep the person\'s face, body shape, pose, skin tone, and hair completely unchanged. Only replace their current outfit with the clothing from reference image 2. Photorealistic result, natural lighting, seamless fit.';
          if (clothingCustomPrompt?.trim()) {
              prompt += ` Additional requirements: ${clothingCustomPrompt.trim()}`;
          }
          if (clothingBg?.description) {
              prompt += ` Nền: ${clothingBg.description}`;
          }
          if (clothingPose?.description) {
              prompt += ` Tư thế: ${clothingPose.description}`;
          }

          const settings: GenerationSettings = {
              ...imageSettings,
              userPrompt: prompt,
              aspectRatio: clothingAspectRatio || '1:1',
          };

          const url = await generateWithTramSangTao(images, settings);
          setClothingResultUrl(url);
          setClothingResultPart(await fileToPart(new File([await (await fetch(url)).blob()], 'res.png', { type: 'image/png' })));
      } catch (e: any) {
          console.error('Clothing swap failed:', e);
          alert(e?.message || 'Thay đồ thất bại. Vui lòng thử lại.');
      } finally { setIsClothingProcessing(false); }
  };

  const renderHomeGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full max-w-7xl animate-fade-in pb-32">
        {TOOLS.map((tool) => (
            <button 
              key={tool.id} 
              onClick={() => setViewMode(tool.id as ViewMode)} 
              className={`group relative flex flex-col items-center justify-center p-10 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] hover:border-sky-500/50 transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden`}
            >
                <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                <div className="scan-effect opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className={`w-24 h-24 rounded-3xl bg-zinc-800/50 flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
                  <tool.icon className={`w-12 h-12 ${tool.text} group-hover:drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]`} />
                </div>
                <span className="text-xl font-black text-white tracking-tight text-center uppercase mb-2">{tool.title}</span>
                <span className={`text-[10px] ${tool.subText} font-black uppercase tracking-widest text-center opacity-60 group-hover:opacity-100 transition-opacity`}>{tool.desc}</span>
                
                <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                    <div className="selection-badge">
                        <span className="text-sky-400 text-[9px] font-black uppercase tracking-[0.2em]">NHẤN ĐỂ CHỌN</span>
                    </div>
                </div>

                {/* Decorative corner element */}
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-white/5 group-hover:bg-sky-500 transition-colors"></div>
            </button>
        ))}
    </div>
  );

  const renderHomeCarousel = () => (
    <div className="w-full h-full flex flex-col items-center justify-center pb-32 relative">
        {/* Navigation Arrows */}
        <button 
          onClick={(e) => { e.stopPropagation(); setActiveCarouselIndex(p => (p - 1 + TOOLS.length) % TOOLS.length); }}
          className={`absolute left-10 top-1/2 -translate-y-1/2 z-[100] w-16 h-16 rounded-full bg-zinc-900/80 border border-white/10 flex items-center justify-center hover:bg-zinc-800 hover:border-sky-500/50 transition-all group shadow-2xl hidden md:flex ${pressedKey === 'ArrowLeft' ? 'scale-90 bg-sky-600 border-sky-400' : ''}`}
        >
          <ChevronLeftIcon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); setActiveCarouselIndex(p => (p + 1) % TOOLS.length); }}
          className={`absolute right-10 top-1/2 -translate-y-1/2 z-[100] w-16 h-16 rounded-full bg-zinc-900/80 border border-white/10 flex items-center justify-center hover:bg-zinc-800 hover:border-sky-500/50 transition-all group shadow-2xl hidden md:flex ${pressedKey === 'ArrowRight' ? 'scale-90 bg-sky-600 border-sky-400' : ''}`}
        >
          <ChevronRightIcon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
        </button>

        <div className="w-full h-[600px] relative flex justify-center items-center perspective-2000 overflow-visible animate-fade-in" onTouchStart={e => touchStart.current = e.touches[0].clientX} onTouchMove={e => touchEnd.current = e.touches[0].clientX} onTouchEnd={() => { if(!touchStart.current || !touchEnd.current) return; const d = touchStart.current - touchEnd.current; if(d > 50) setActiveCarouselIndex(p => (p+1)%TOOLS.length); if(d < -50) setActiveCarouselIndex(p => (p-1+TOOLS.length)%TOOLS.length); touchStart.current = touchEnd.current = null; }}>
            {TOOLS.map((tool, index) => {
                const offset = ((index - activeCarouselIndex + TOOLS.length + (TOOLS.length/2)) % TOOLS.length) - (TOOLS.length/2);
                const absOffset = Math.abs(offset); if (absOffset > 2.5) return null;
                const isActive = index === activeCarouselIndex;
                const transform = `translateX(${offset * 120}%) scale(${1 - absOffset * 0.2}) rotateY(${offset * -15}deg) ${isActive ? 'translateZ(150px)' : ''}`;
                return (
                    <div 
                      key={tool.id} 
                      onClick={() => isActive ? setViewMode(tool.id as ViewMode) : setActiveCarouselIndex(index)} 
                      style={{ transform, zIndex: 50 - Math.round(absOffset * 10), opacity: 1 - absOffset * 0.4, transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} 
                      className={`absolute w-80 h-[450px] cursor-pointer rounded-[3rem] p-1.5 bg-gradient-to-br from-zinc-800 to-black border-2 ${isActive ? 'border-sky-500 shadow-[0_50px_100px_-20px_rgba(14,165,233,0.3)]' : 'border-white/5'}`}
                    >
                        <div className={`w-full h-full rounded-[2.6rem] bg-[#0d0d0d] flex flex-col items-center justify-center p-10 relative overflow-hidden group`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-700`}></div>
                            {isActive && <div className="scan-effect"></div>}
                            
                            <div className={`w-32 h-32 rounded-[2.5rem] bg-zinc-900/50 flex items-center justify-center mb-6 border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-700`}>
                              <tool.icon className={`w-16 h-16 ${tool.text} group-hover:drop-shadow-[0_0_20px_rgba(14,165,233,0.4)]`} />
                            </div>
                            
                            <h3 className="text-3xl font-black text-white text-center uppercase tracking-tighter mb-3 z-10">{tool.title}</h3>
                            <p className={`${tool.subText} text-center text-[11px] font-black uppercase tracking-widest z-10 opacity-60`}>{tool.desc}</p>
                            
                            {isActive && (
                              <div className="absolute bottom-4 flex flex-col items-center gap-3 z-10">
                                <div className="selection-badge">
                                    <span className="text-sky-400 text-[10px] font-black uppercase tracking-[0.3em]">NHẤN ĐỂ CHỌN</span>
                                </div>
                              </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
        
        {/* Carousel Indicators */}
        <div className="flex gap-2 mt-12">
          {TOOLS.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-500 ${idx === activeCarouselIndex ? 'w-8 bg-sky-500' : 'w-2 bg-white/10'}`}
            ></div>
          ))}
        </div>
    </div>
  );

  const renderControlGuide = () => {
    if (viewMode !== 'home' || homeDisplayMode !== 'carousel') return null;
    
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-4 w-full max-w-5xl px-4">
        <div className="flex items-center gap-10 px-12 py-5 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)] animate-fade-in ring-1 ring-white/10 group/guide">
          {/* Decorative background glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-sky-500/5 to-transparent rounded-[2.5rem] pointer-events-none"></div>
          
          <div className="flex items-center gap-4 text-sky-400 relative">
            <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
              <ComputerDesktopIcon className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-sky-500/50 uppercase tracking-[0.3em] leading-none mb-1">Hệ thống</span>
              <span className="text-[13px] font-black text-white uppercase tracking-[0.1em] leading-none">ĐIỀU KHIỂN</span>
            </div>
          </div>
          
          <div className="h-8 w-px bg-white/10 mx-2"></div>
          
          <div className="flex items-center gap-8 relative">
            {/* Navigation Keys */}
            <div className="flex items-center gap-4 group/item">
              <div className="flex gap-1.5">
                <button 
                  onClick={() => setActiveCarouselIndex(prev => (prev - 1 + TOOLS.length) % TOOLS.length)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-black text-white shadow-lg transform transition-all hover:bg-zinc-800 ${pressedKey === 'ArrowLeft' ? 'translate-y-1 border-b-0 bg-sky-600' : 'bg-[#1a1a1a] border-b-4 border-black'}`}
                >
                  ←
                </button>
                <button 
                  onClick={() => setActiveCarouselIndex(prev => (prev + 1) % TOOLS.length)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-black text-white shadow-lg transform transition-all hover:bg-zinc-800 ${pressedKey === 'ArrowRight' ? 'translate-y-1 border-b-0 bg-sky-600' : 'bg-[#1a1a1a] border-b-4 border-black'}`}
                >
                  →
                </button>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Navigation</span>
                <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">DI CHUYỂN</span>
              </div>
            </div>
            
            {/* Enter Key */}
            <div className="flex items-center gap-4 group/item">
              <button 
                onClick={() => setViewMode(TOOLS[activeCarouselIndex].id as ViewMode)}
                className={`px-3 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-lg transform transition-all min-w-[60px] hover:bg-zinc-800 ${pressedKey === 'Enter' ? 'translate-y-1 border-b-0 bg-sky-600' : 'bg-[#1a1a1a] border-b-4 border-black'}`}
              >
                ENTER
              </button>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Action</span>
                <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">CHỌN</span>
              </div>
            </div>
            
            {/* Fullscreen Key */}
            <div className="flex items-center gap-4 group/item">
              <button 
                onClick={() => { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-black text-white shadow-lg transform transition-all hover:bg-zinc-800 ${pressedKey?.toLowerCase() === 'f' ? 'translate-y-1 border-b-0 bg-sky-600' : 'bg-[#1a1a1a] border-b-4 border-black'}`}
              >
                F
              </button>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">View</span>
                <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">TOÀN MÀN HÌNH</span>
              </div>
            </div>
  
            <div className="h-8 w-px bg-white/10 mx-2"></div>
  
            {/* Rules Button */}
            <button 
              onClick={() => setIsRulesOpen(true)}
              className="flex items-center gap-3 px-6 py-2.5 bg-red-500/10 border border-red-500/20 rounded-2xl hover:bg-red-500/20 transition-all group/btn relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="text-xl group-hover/btn:scale-125 transition-transform duration-300">📌</span>
              <div className="flex flex-col items-start">
                <span className="text-[9px] font-black text-red-500/60 uppercase tracking-widest mb-0.5">Policy</span>
                <span className="text-[11px] font-black text-red-400 uppercase tracking-widest">NỘI QUY</span>
              </div>
            </button>
          </div>
        </div>

        {/* Rules Text Banner */}
        <div className="w-full bg-black/60 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:bg-black/80 transition-all" onClick={() => setIsRulesOpen(true)}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
              <span className="text-xl">📜</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white uppercase tracking-[0.1em]">📌 NỘI QUY SỬ DỤNG TOOL TRÊN NỀN TẢNG AI STUDIO</span>
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Đảm bảo an toàn • Hiệu quả • Trách nhiệm • Tuân thủ pháp luật</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-px bg-white/5"></div>
            <button className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black text-gray-400 uppercase tracking-widest transition-all border border-white/5 group-hover:text-white">Xem chi tiết nội quy</button>
          </div>
        </div>
      </div>
    );
  };

  const renderVoiceUI = () => (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <VoiceSelector 
            voices={AVAILABLE_VOICES} 
            selectedValue={selectedVoice} 
            onChange={(e) => setSelectedVoice(e.target.value)} 
            disabled={isVoiceLoading} 
          />
          <SpeedControl 
            speed={playbackRate} 
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))} 
            disabled={isVoiceLoading} 
          />
          <SrtUploader onTextLoaded={setVoiceText} disabled={isVoiceLoading} />
          <GenerateButton onClick={handleGenerateVoice} isLoading={isVoiceLoading} />
        </div>
        <div className="space-y-6">
          <label htmlFor="text-input" className="block text-sm font-medium text-gray-400 mb-2">Nhập văn bản của bạn</label>
          <TextAreaInput value={voiceText} onChange={(e) => setVoiceText(e.target.value)} disabled={isVoiceLoading} />
          {voiceProgress > 0 && voiceProgress < 100 && <ProgressBar progress={voiceProgress} />}
          {audioData && <AudioPlayer audioUrl={audioData.url} isCompleted={isVoiceCompleted} playbackRate={playbackRate} />}
          {voiceError && <ErrorMessage errorDetails={voiceError} />}
        </div>
      </div>
      <HistoryPanel 
        history={voiceHistory} 
        voices={AVAILABLE_VOICES} 
        onUse={(item) => { setVoiceText(item.text); setSelectedVoice(item.voice); setPlaybackRate(item.speed); }} 
        onDelete={(id) => setVoiceHistory(prev => prev.filter(h => h.id !== id))} 
      />
      <TranslatorPanel 
        inputText={translatorInput} 
        onInputChange={(e) => setTranslatorInput(e.target.value)} 
        outputText={translatorOutput} 
        isLoading={isTranslating} 
        error={translatorError} 
        onTranslate={async () => {
          setIsTranslating(true);
          setTranslatorError(null);
          try {
            const res = await translateText(translatorInput);
            setTranslatorOutput(res);
          } catch (e: any) {
            setTranslatorError({ title: 'Lỗi dịch', message: e.message, suggestions: [] });
          } finally { setIsTranslating(false); }
        }} 
      />
    </div>
  );

  const renderProfileUI = () => {
    const sourceImage = profileImages[0];
    const printItems = {
        '4x6': [1,2,3,4],
        '3x4': [1,2,3,4,5,6,7,8],
        '2x3': [1,2,3,4,5,6,7,8,9,10,11,12],
        'mixed': [1,2,3,4]
    };

    return (
        <div className="flex flex-col h-full gap-8 max-w-full mx-auto px-4 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
                
                {/* Panel 1: ẢNH GỐC */}
                <div className="flex flex-col border border-zinc-800 bg-[#0a0a0a] rounded-xl overflow-hidden shadow-2xl relative group">
                    <div className="absolute top-4 left-4 z-20 pointer-events-none">
                        <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded shadow-md uppercase tracking-widest border border-white/10">ẢNH GỐC</span>
                    </div>
                    {sourceImage && (
                        <button onClick={() => setProfileImages([])} className="absolute top-4 right-4 z-20 bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg shadow-lg transition-all"><XMarkIcon className="w-5 h-5" /></button>
                    )}
                    <div className="flex-1 relative flex items-center justify-center bg-black min-h-[450px]">
                        {sourceImage ? (
                            <img src={sourceImage.originalPreviewUrl} className="max-w-full max-h-full object-contain cursor-zoom-in" onClick={() => openLightbox(sourceImage)} />
                        ) : (
                            <label className="flex flex-col items-center justify-center cursor-pointer p-10 hover:bg-sky-950/10 transition-all w-full h-full">
                                <PlusIcon className="w-16 h-16 text-sky-500 mb-6" />
                                <span className="text-white text-2xl font-black uppercase tracking-tighter">Tải Ảnh Chân Dung</span>
                                <input type="file" onChange={e => e.target.files && handleImageUpload(e.target.files)} className="hidden" accept="image/*" />
                            </label>
                        )}
                    </div>
                    <div className="p-3 bg-[#111] border-t border-zinc-800 flex gap-3">
                        <button onClick={() => sourceImage && openCropper(sourceImage)} disabled={!sourceImage} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-gray-200 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 border border-zinc-700 disabled:opacity-30"><ScissorsIcon className="w-4 h-4" /> Cắt & Xoay 3x4</button>
                        <button onClick={() => sourceImage && openDrawing(sourceImage)} disabled={!sourceImage} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-gray-200 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 border border-zinc-700 disabled:opacity-30"><PencilIcon className="w-4 h-4" /> Vẽ lên ảnh</button>
                    </div>
                </div>

                {/* Panel 2: KẾT QUẢ AI */}
                <div className="flex flex-col border border-sky-900/30 bg-[#0a0a0a] rounded-xl overflow-hidden shadow-2xl relative">
                    <div className="absolute top-4 left-4 z-20"><div className="w-8 h-8 rounded bg-sky-600 border border-sky-400 flex items-center justify-center shadow-lg"><CheckIcon className="w-5 h-5 text-white stroke-[3px]" /></div></div>
                    {sourceImage?.generatedImageUrl && (
                         <button onClick={() => setProfileImages(prev => prev.map(p => ({...p, generatedImageUrl: undefined, status: 'idle'})))} className="absolute top-4 right-4 z-20 bg-zinc-800/80 hover:bg-zinc-700 text-gray-400 p-2 rounded-lg shadow-lg transition-all"><TrashIcon className="w-5 h-5" /></button>
                    )}
                    <div className="absolute top-14 right-4 z-20 pointer-events-none"><span className="bg-zinc-300 text-zinc-900 text-[10px] font-black px-3 py-1 rounded shadow-md uppercase tracking-widest">KẾT QUẢ AI</span></div>
                    <div className="flex-1 relative flex items-center justify-center bg-[#050505] min-h-[450px]">
                        {sourceImage?.status === 'generating' ? (
                            <div className="flex flex-col items-center gap-4"><div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div><span className="text-sky-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Đang xử lý AI...</span></div>
                        ) : sourceImage?.generatedImageUrl ? (
                            <img src={sourceImage.generatedImageUrl} className="max-w-full max-h-full object-contain cursor-zoom-in" onClick={() => openLightbox(sourceImage)} />
                        ) : (
                            <div className="flex flex-col items-center justify-center opacity-20 p-10 select-none"><SparklesIcon className="w-20 h-20 text-zinc-700 mb-6" /><span className="text-zinc-500 font-black uppercase tracking-tighter text-center">Kết quả sẽ hiển thị ở đây</span></div>
                        )}
                    </div>
                    <div className="p-3 bg-[#111] border-t border-zinc-800 flex gap-2">
                        <button onClick={() => sourceImage && handleRegenerateImage(sourceImage)} disabled={!sourceImage || sourceImage.status === 'generating'} className="flex-[2] py-3 bg-[#e65100] hover:bg-[#ff6d00] text-white rounded-lg font-black text-sm uppercase flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-30">{sourceImage?.status === 'generating' ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : "TẠO ẢNH"}</button>
                        <button disabled={!sourceImage?.generatedImageUrl} className="w-12 py-3 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-lg flex items-center justify-center border border-zinc-700 disabled:opacity-30" onClick={() => sourceImage && openCropper(sourceImage)}><ScissorsIcon className="w-5 h-5" /></button>
                        <a href={sourceImage?.generatedImageUrl || '#'} download="nhc_profile_result.png" onClick={e => !sourceImage?.generatedImageUrl && e.preventDefault()} className={`flex-[2] py-3 bg-[#0288d1] hover:bg-[#03a9f4] text-white rounded-lg font-black text-sm uppercase flex items-center justify-center gap-2 shadow-lg transition-all ${!sourceImage?.generatedImageUrl ? 'opacity-30 cursor-not-allowed' : ''}`}><ArrowDownTrayIcon className="w-5 h-5 stroke-[2px]" /> TẢI VỀ</a>
                    </div>
                </div>

                {/* Panel 3: IN XẾP ẢNH */}
                <div className="flex flex-col border border-indigo-900/30 bg-[#0a0a0a] rounded-xl overflow-hidden shadow-2xl relative">
                    <div className="absolute top-4 left-4 z-20 pointer-events-none"><span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded shadow-md uppercase tracking-widest border border-indigo-400/30">IN XẾP ẢNH AI</span></div>
                    <div className="flex-1 relative flex items-center justify-center bg-[#0d0d0d] min-h-[450px] p-6 overflow-hidden">
                        {sourceImage?.generatedImageUrl ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                {/* Print Preview Canvas Representation */}
                                <div className="bg-white p-4 shadow-2xl rounded-sm aspect-[10/15] h-[350px] relative overflow-hidden flex items-center justify-center">
                                    <div className={`grid gap-1 w-full h-full ${printLayout === '4x6' ? 'grid-cols-2 grid-rows-2' : printLayout === '3x4' ? 'grid-cols-2 grid-rows-4' : printLayout === '2x3' ? 'grid-cols-3 grid-rows-4' : 'grid-cols-2'}`}>
                                        {printLayout === 'mixed' ? (
                                            <>
                                                <div className="col-span-2 row-span-1 border border-gray-100 flex gap-1">
                                                    <img src={sourceImage.generatedImageUrl} className="w-full h-full object-cover" />
                                                    <img src={sourceImage.generatedImageUrl} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="col-span-1 row-span-1 border border-gray-100"><img src={sourceImage.generatedImageUrl} className="w-full h-full object-cover" /></div>
                                                <div className="col-span-1 row-span-1 border border-gray-100"><img src={sourceImage.generatedImageUrl} className="w-full h-full object-cover" /></div>
                                            </>
                                        ) : (
                                            printItems[printLayout].map(i => (
                                                <div key={i} className="border border-gray-100"><img src={sourceImage.generatedImageUrl} className="w-full h-full object-cover" /></div>
                                            ))
                                        )}
                                    </div>
                                    <div className="absolute top-1 right-1 text-[6px] text-gray-400 font-bold uppercase rotate-90">NHC Photoshop • 10x15cm Paper</div>
                                </div>
                                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Khổ giấy in chuẩn 10x15cm (A6)</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center opacity-20 p-10 select-none"><PrinterIcon className="w-20 h-20 text-zinc-700 mb-6" /><span className="text-zinc-500 font-black uppercase tracking-tighter text-center">Dàn trang in tự động</span></div>
                        )}
                    </div>
                    
                    <div className="p-3 bg-[#111] border-t border-zinc-800 space-y-3">
                        {/* Layout Selector Buttons */}
                        <div className="grid grid-cols-4 gap-1.5">
                            {[
                                { id: '4x6', label: '4x6' },
                                { id: '3x4', label: '3x4' },
                                { id: '2x3', label: '2x3' },
                                { id: 'mixed', label: 'Mix' }
                            ].map(layout => (
                                <button 
                                    key={layout.id}
                                    onClick={() => setPrintLayout(layout.id as PrintLayoutType)}
                                    className={`py-1.5 rounded text-[10px] font-black uppercase transition-all border ${printLayout === layout.id ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-zinc-800 border-zinc-700 text-gray-400 hover:bg-zinc-700'}`}
                                >
                                    {layout.label}
                                </button>
                            ))}
                        </div>
                        {/* Print Ready Download Button */}
                        <button 
                            onClick={() => sourceImage?.generatedImageUrl && handleDownloadPrintSheet(sourceImage.generatedImageUrl)}
                            disabled={!sourceImage?.generatedImageUrl}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-black text-sm uppercase flex items-center justify-center gap-3 shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <PrinterIcon className="w-6 h-6 stroke-[2px]" />
                            TẢI ẢNH IN NGAY
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
  };

  const renderBabyUltrasoundUI = () => (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-20">
        {babyUltrasoundSettings.babyPredictMode === 'ultrasound' ? (
             <div className="flex flex-col items-center">
                 <div className="w-full max-w-2xl space-y-4">
                    <label className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div> Ảnh Siêu Âm Em Bé (4D/5D)
                    </label>
                    <label className={`relative block border-4 border-dashed rounded-3xl h-[500px] overflow-hidden cursor-pointer hover:bg-cyan-900/10 transition-all ${babyUltrasoundFile ? 'border-cyan-500 ring-4 ring-cyan-500/20' : 'border-zinc-800'}`}>
                        {babyUltrasoundFile ? (
                            <img src={babyUltrasoundFile.url} className="w-full h-full object-cover animate-fade-in" alt="Ultrasound" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                <div className="p-5 bg-zinc-800 rounded-full mb-4 shadow-xl"><PhotoIcon className="w-14 h-14 text-cyan-400" /></div>
                                <span className="font-black text-sm tracking-tighter uppercase">Chọn ảnh siêu âm</span>
                                <p className="text-xs text-gray-600 mt-2 px-10 text-center">Hệ thống sẽ phân tích các đường nét từ ảnh siêu âm để dự đoán khuôn mặt thật</p>
                            </div>
                        )}
                        <input type="file" className="hidden" onChange={e => e.target.files && handleBabyPredictionUpload('ultrasound', e.target.files[0])} accept="image/*" />
                    </label>
                 </div>
             </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div> Ảnh Người Cha
                    </label>
                    <label className={`relative block border-4 border-dashed rounded-3xl h-[450px] overflow-hidden cursor-pointer hover:bg-sky-900/10 transition-all ${babyFather ? 'border-sky-500 ring-4 ring-sky-500/20' : 'border-zinc-800'}`}>
                        {babyFather ? (
                            <img src={babyFather.url} className="w-full h-full object-cover animate-fade-in" alt="Father" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                <div className="p-5 bg-zinc-800 rounded-full mb-4 shadow-xl"><UserIcon className="w-14 h-14 text-sky-400" /></div>
                                <span className="font-black text-sm tracking-tighter uppercase">Chọn ảnh Bố</span>
                            </div>
                        )}
                        <input type="file" className="hidden" onChange={e => e.target.files && handleBabyPredictionUpload('father', e.target.files[0])} accept="image/*" />
                        {babyFather && <div className="absolute bottom-4 right-4 bg-sky-600 p-2 rounded-full shadow-lg"><CheckIcon className="w-5 h-5 text-white" /></div>}
                    </label>
                </div>
                <div className="space-y-4">
                    <label className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div> Ảnh Người Mẹ
                    </label>
                    <label className={`relative block border-4 border-dashed rounded-3xl h-[450px] overflow-hidden cursor-pointer hover:bg-pink-900/10 transition-all ${babyMother ? 'border-pink-500 ring-4 ring-pink-500/20' : 'border-zinc-800'}`}>
                        {babyMother ? (
                            <img src={babyMother.url} className="w-full h-full object-cover animate-fade-in" alt="Mother" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                <div className="p-5 bg-zinc-800 rounded-full mb-4 shadow-xl"><UserIcon className="w-14 h-14 text-pink-400" /></div>
                                <span className="font-black text-sm tracking-tighter uppercase">Chọn ảnh Mẹ</span>
                            </div>
                        )}
                        <input type="file" className="hidden" onChange={e => e.target.files && handleBabyPredictionUpload('mother', e.target.files[0])} accept="image/*" />
                        {babyMother && <div className="absolute bottom-4 right-4 bg-pink-600 p-2 rounded-full shadow-lg"><CheckIcon className="w-5 h-5 text-white" /></div>}
                    </label>
                </div>
            </div>
        )}
        
        {images.length > 0 && (
            <div className="mt-8 space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <SparklesIcon className="w-8 h-8 text-yellow-400" />
                        Kết quả phân tích & dự đoán
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {images.map(img => (
                        <ImageCard 
                            key={img.id} 
                            item={img} 
                            onToggleSelect={id => setImages(p => p.map(x => x.id === id ? { ...x, isSelected: !x.isSelected } : x))} 
                            onDelete={id => setImages(p => p.filter(x => x.id !== id))} 
                            onRegenerate={handleRegenerateImage} 
                            onDoubleClick={() => openLightbox(img)} 
                            onCrop={openCropper} 
                            onDraw={openDrawing}
                        />
                    ))}
                    <label className="border-2 border-dashed border-gray-700 bg-[#151515] rounded-lg flex flex-col items-center justify-center cursor-pointer min-h-[300px] hover:border-sky-500/50 transition-colors">
                        <PlusIcon className="w-8 h-8 mb-4 text-gray-400" />
                        <span className="text-gray-400 font-bold">Thêm ảnh</span>
                        <input type="file" multiple onChange={e => e.target.files && handleImageUpload(e.target.files)} className="hidden" accept="image/*" />
                    </label>
                </div>
            </div>
        )}
    </div>
  );

  const renderClothingUI = () => (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Ảnh Người Mẫu</label>
                <label className={`relative block border-2 border-dashed rounded-xl h-64 overflow-hidden cursor-pointer hover:bg-zinc-800 transition-colors ${clothingPerson ? 'border-sky-500' : 'border-zinc-700'}`}>
                    {clothingPerson ? <img src={clothingPerson.url} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500"><UserIcon className="w-12 h-12 mb-2" /><span>Tải ảnh người</span></div>}
                    <input type="file" className="hidden" onChange={e => e.target.files && handleClothingFileUpload('person', e.target.files[0])} accept="image/*" />
                </label>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Ảnh Trang Phục</label>
                <label className={`relative block border-2 border-dashed rounded-xl h-64 overflow-hidden cursor-pointer hover:bg-zinc-800 transition-colors ${clothingCloth ? 'border-sky-500' : 'border-zinc-700'}`}>
                    {clothingCloth ? <img src={clothingCloth.url} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500"><ShoppingBagIcon className="w-12 h-12 mb-2" /><span>Tải ảnh quần áo</span></div>}
                    <input type="file" className="hidden" onChange={e => e.target.files && handleClothingFileUpload('cloth', e.target.files[0])} accept="image/*" />
                </label>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Bối Cảnh (Tùy chọn)</label>
                <label className="relative block border-2 border-dashed border-zinc-700 rounded-xl h-64 overflow-hidden cursor-pointer hover:bg-zinc-800 transition-colors">
                    {clothingBg ? <img src={clothingBg.url} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500"><PhotoIcon className="w-12 h-12 mb-2" /><span>Tải ảnh nền</span></div>}
                    <input type="file" className="hidden" onChange={e => e.target.files && handleClothingFileUpload('bg', e.target.files[0])} accept="image/*" />
                </label>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Dáng Người (Tùy chọn)</label>
                <label className="relative block border-2 border-dashed border-zinc-700 rounded-xl h-64 overflow-hidden cursor-pointer hover:bg-zinc-800 transition-colors">
                    {clothingPose ? <img src={clothingPose.url} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500"><FingerPrintIcon className="w-12 h-12 mb-2" /><span>Tải ảnh dáng</span></div>}
                    <input type="file" className="hidden" onChange={e => e.target.files && handleClothingFileUpload('pose', e.target.files[0])} accept="image/*" />
                </label>
            </div>
        </div>

        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <label className="block text-xs font-bold text-gray-400 uppercase">Yêu cầu đặc biệt</label>
                    <textarea value={clothingCustomPrompt} onChange={e => setClothingCustomPrompt(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm focus:border-sky-500" rows={3} placeholder="Mô tả chi tiết thêm nếu cần..." />
                </div>
                <div className="flex flex-col justify-between">
                    <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                        <span className="text-sm font-bold text-gray-300">Tăng độ nét (Upscale)</span>
                        <button onClick={() => setClothingEnableUpscale(!clothingEnableUpscale)} className={`w-12 h-6 rounded-full transition-colors relative ${clothingEnableUpscale ? 'bg-sky-600' : 'bg-gray-700'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${clothingEnableUpscale ? 'right-1' : 'left-1'}`} />
                        </button>
                    </div>
                    <button onClick={generateSwap} disabled={!clothingPerson || !clothingCloth || isClothingProcessing} className="w-full mt-4 py-4 bg-gradient-to-r from-sky-600 to-blue-600 rounded-xl font-bold uppercase flex items-center justify-center gap-3 disabled:opacity-30">
                        {isClothingProcessing ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <SparklesIcon className="w-6 h-6" />}
                        Bắt đầu thay đồ AI
                    </button>
                </div>
            </div>
        </div>

        {clothingResultUrl && (
            <div className="flex flex-col items-center gap-6 mt-8 p-8 bg-zinc-900 rounded-3xl border border-sky-500/30">
                <h3 className="text-2xl font-black text-sky-400 uppercase tracking-tighter">Kết quả thay đồ</h3>
                <div className="relative group max-w-lg w-full">
                    <img src={clothingResultUrl} className="w-full rounded-2xl shadow-2xl border border-gray-700" />
                    <a href={clothingResultUrl} download="clothing_swap.png" className="absolute bottom-4 right-4 p-4 bg-sky-600 hover:bg-sky-500 text-white rounded-full shadow-lg transition-transform hover:scale-110">
                        <ArrowDownTrayIcon className="w-6 h-6" />
                    </a>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setShowClothingRefine(true)} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm font-bold uppercase tracking-widest">Chỉnh sửa thêm</button>
                    <button onClick={() => setClothingResultUrl(null)} className="px-6 py-3 text-gray-500 hover:text-white uppercase text-xs font-bold">Xóa kết quả</button>
                </div>
            </div>
        )}

        {showClothingRefine && (
            <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4">
                <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-gray-700 max-w-md w-full">
                    <h3 className="text-xl font-bold mb-4 uppercase">Chỉnh sửa kết quả</h3>
                    <textarea value={clothingRefinePrompt} onChange={e => setClothingRefinePrompt(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded p-4 mb-4" rows={4} placeholder="VD: Đổi màu áo sang đỏ, sửa lại cổ áo..." />
                    <div className="flex gap-4">
                        <button onClick={() => setShowClothingRefine(false)} className="flex-1 py-3 bg-zinc-800 rounded font-bold">Hủy</button>
                        <button onClick={async () => {
                            setIsClothingProcessing(true); setShowClothingRefine(false);
                            try {
                                const res = await refineClothingResult(clothingResultPart!, clothingRefinePrompt, clothingAspectRatio, clothingEnableUpscale);
                                setClothingResultUrl(res);
                                setClothingResultPart(await fileToPart(new File([await (await fetch(res)).blob()], 'refine.png', { type: 'image/png' })));
                            } catch (e) {} finally { setIsClothingProcessing(false); }
                        }} className="flex-1 py-3 bg-sky-600 rounded font-bold">Thực hiện</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  const renderLoginUI = () => (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] bg-grid p-6 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/20 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-12 relative z-10 animate-fade-in">
            {/* Login Form Section */}
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-sky-500/20 mb-6 group hover:scale-110 transition-transform duration-500">
                        <ShieldCheckIcon className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">TOOL MAGIC NHC VIP PRO</h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Xác thực quyền truy cập</p>
                </div>

                <form onSubmit={handleLogin} className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
                    {loginError && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-shake">
                            <ShieldExclamationIcon className="w-5 h-5 text-red-500" />
                            <span className="text-xs font-bold text-red-400 uppercase tracking-tight">{loginError}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-sky-500 uppercase tracking-widest ml-1 flex items-center justify-between">
                                Mã xác thực 2FA
                                <span className="text-[8px] bg-sky-500/10 px-2 py-0.5 rounded text-sky-400">REQUIRED</span>
                            </label>
                            <div className="relative group">
                                <FingerPrintIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-sky-500 transition-colors" />
                                <input 
                                    type={showTfa ? "text" : "password"} 
                                    value={loginForm.tfa} 
                                    onChange={e => setLoginForm(prev => ({ ...prev, tfa: e.target.value }))}
                                    className="w-full bg-black/40 border-2 border-sky-500/20 rounded-2xl py-4 pl-12 pr-12 text-sm text-white focus:border-sky-500 outline-none transition-all placeholder:text-zinc-800 font-black tracking-[0.5em] uppercase"
                                    placeholder="MÃ 2FA..."
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowTfa(!showTfa)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-sky-500 transition-colors"
                                >
                                    {showTfa ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div 
                                onClick={() => setRememberMe(!rememberMe)}
                                className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${rememberMe ? 'bg-sky-600 border-sky-500 shadow-lg shadow-sky-900/20' : 'bg-black/40 border-white/10'}`}
                            >
                                {rememberMe && <CheckIcon className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">Ghi nhớ thông tin tài khoản</span>
                        </label>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full py-5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-sky-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
                    >
                        Đăng nhập ngay
                        <RocketLaunchIcon className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>

                    <div className="pt-4 text-center">
                        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Hệ thống bảo mật bởi NHC Photoshop Team</p>
                    </div>
                </form>
            </div>

            {/* Bank Info Section */}
            <div className="w-full max-w-sm bg-zinc-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                {/* Rainbow Border Effect */}
                <div className="absolute inset-0 rounded-[2.5rem] p-[1px] bg-gradient-to-br from-green-500 via-sky-500 to-blue-600 opacity-50">
                    <div className="w-full h-full bg-zinc-900 rounded-[2.5rem]"></div>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="bg-white rounded-3xl p-6 flex flex-col items-center gap-4 shadow-inner">
                        <p className="text-[11px] font-black text-zinc-800 uppercase tracking-widest">Quét mã để chuyển khoản</p>
                        <img 
                            src="https://img.vietqr.io/image/VPB-0828998995-qr_only.png" 
                            alt="VietQR" 
                            className="w-full aspect-square object-contain"
                            referrerPolicy="no-referrer"
                        />
                        <div className="pt-2 border-t border-zinc-100 w-full flex justify-center">
                            <img src="https://api.vietqr.io/img/VPB.png" alt="VPBank" className="h-8 object-contain" referrerPolicy="no-referrer" />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tên Ngân Hàng :</span>
                            <span className="text-sm font-black text-white uppercase">VPBank</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Chủ Tài Khoản :</span>
                            <span className="text-sm font-black text-white uppercase">Nguyễn Hữu Chính</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-tight">SĐT + ZALO +</span>
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-tight">STK :</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-black text-sky-500 tracking-wider">0828998995</span>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText('0828998995');
                                        alert('Đã sao chép số tài khoản!');
                                    }}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-[9px] font-black text-zinc-400 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-widest"
                                >
                                    Chép
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );

  if (!isLoggedIn) return renderLoginUI();

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] bg-grid text-gray-200 font-sans overflow-hidden selection:bg-sky-500/30">
        <header className="flex-none flex items-center justify-between px-8 py-5 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-[150]">
             <div className="w-1/3 flex items-center gap-4">
                 {viewMode === 'home' && (
                   <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
                     <button 
                        onClick={() => setHomeDisplayMode('grid')} 
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${homeDisplayMode === 'grid' ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/20' : 'text-gray-500 hover:text-gray-300'}`}
                     >
                       Lưới
                     </button>
                     <button 
                        onClick={() => setHomeDisplayMode('carousel')} 
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${homeDisplayMode === 'carousel' ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/20' : 'text-gray-500 hover:text-gray-300'}`}
                     >
                       3D
                     </button>
                   </div>
                 )}
                 {viewMode !== 'home' && viewMode !== 'voice' && viewMode !== 'clothing' && (
                   <div className="flex items-center gap-3">
                     <button 
                      onClick={() => setViewMode('home')} 
                      className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-900/20 transition-all active:scale-95"
                     >
                       Trở về
                     </button>
                     <button 
                      onClick={() => setImages(p => p.map(img => ({...img, isSelected: !p.every(x => x.isSelected)})))} 
                      className="px-5 py-2 bg-zinc-900/50 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all text-gray-300"
                     >
                       {images.every(x => x.isSelected) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                     </button>
                     
                     <button 
                      onClick={() => {
                        const selectedCount = images.filter(img => img.isSelected).length;
                        if (selectedCount === 0) return;
                        if (window.confirm(`Bạn có chắc chắn muốn xoá ${selectedCount} ảnh đã chọn không?`)) {
                          setImages(p => p.filter(img => !img.isSelected));
                        }
                      }} 
                      className="px-5 py-2 bg-zinc-900/50 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all text-gray-400 flex items-center gap-2"
                     >
                       <TrashIcon className="w-3.5 h-3.5" />
                       Xoá ảnh đã chọn
                     </button>

                     <button 
                      onClick={() => {
                        if (images.length === 0) return;
                        images.forEach((img, i) => {
                          setTimeout(() => {
                            const a = document.createElement('a');
                            a.href = img.generatedImageUrl || img.originalPreviewUrl;
                            a.download = `TOOL-MAGIC-NHC-PHOTOSHOP-VIPPRO -0828998995-${viewMode}-${i}.png`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }, i * 200);
                        });
                      }} 
                      className="px-5 py-2 bg-zinc-900/50 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-500/10 hover:border-sky-500/30 hover:text-sky-400 transition-all text-gray-400 flex items-center gap-2"
                     >
                       <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                       Tải Tất Cả Ảnh
                     </button>
                   </div>
                 )}
             </div>
             
             <div className="flex flex-col items-center w-1/3">
                <div className="vip-rainbow-container">
                  <h1 className="text-xl md:text-2xl font-black vip-rainbow-text tracking-tighter">TOOL MAGIC NHC VIP PRO</h1>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/20"></div>
                  <p className={`text-[11px] font-black uppercase tracking-[0.4em] ${viewMode === 'home' ? 'text-sky-500/80' : (TOOLS.find(t => t.id === viewMode)?.text || 'text-zinc-500')}`}>
                    {viewMode === 'home' ? 'Hệ thống công cụ AI' : (TOOLS.find(t => t.id === viewMode)?.title || viewMode)}
                  </p>
                  <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/20"></div>
                </div>
             </div>

             <div className="flex items-center gap-4 justify-end w-1/3">
                <button 
                  onClick={() => setIsRulesOpen(true)} 
                  className="text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-500/20 px-4 py-2 rounded-xl hover:bg-red-500/10 transition-all flex items-center gap-2"
                >
                  <span>📌</span> Nội quy
                </button>
                <button 
                  onClick={() => setIsDonationModalOpen(true)} 
                  className="text-yellow-500 text-[10px] font-black uppercase tracking-widest border border-yellow-500/20 px-4 py-2 rounded-xl hover:bg-yellow-500/10 transition-all flex items-center gap-2"
                >
                  <span>☕</span> Donate
                </button>
                <VisitorCounter />
                <button 
                  onClick={handleLogout} 
                  className="px-4 py-2 bg-zinc-900/50 rounded-xl text-red-500 border border-red-500/20 hover:bg-red-500/10 transition-all flex items-center gap-2 group"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Đăng xuất</span>
                </button>
             </div>
        </header>
        <div className="flex-1 overflow-hidden relative">
            {viewMode === 'home' ? <div className="h-full p-6 bg-grid flex flex-col items-center justify-start gap-10 overflow-y-auto">{homeDisplayMode === 'grid' ? renderHomeGrid() : renderHomeCarousel()}</div> : viewMode === 'voice' ? <div className="h-full bg-grid overflow-y-auto p-6">{renderVoiceUI()}</div> : (
              <div className="flex flex-row h-[calc(100vh-140px)] w-full overflow-hidden">
                  <main className="flex-1 p-6 bg-[#0f1012] bg-grid flex flex-col gap-4 overflow-y-auto">
                    {viewMode === 'clothing' ? renderClothingUI() : viewMode === 'baby-ultrasound' ? renderBabyUltrasoundUI() : viewMode === 'profile' ? renderProfileUI() : (
                        <>
                            {images.length > 0 ? (
                                <div className={`grid gap-6 pb-20 transition-all ${viewMode === 'restoration' || viewMode === 'face-straighten' || viewMode === 'lifestyle' || viewMode === 'mockup' || viewMode === 'lighting-effects' || viewMode === 'remove-background' || viewMode === 'symmetric-edit' || viewMode === 'architecture-render' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'}`}>
                                    {images.map(img => <ImageCard key={img.id} item={img} onToggleSelect={id => setImages(p => p.map(x => x.id === id ? { ...x, isSelected: !x.isSelected } : x))} onDelete={id => setImages(p => p.filter(x => x.id !== id))} onRegenerate={handleRegenerateImage} onDoubleClick={() => openLightbox(img)} onCrop={openCropper} onDraw={openDrawing}/>)}
                                    <label className="border-2 border-dashed border-gray-700 bg-[#151515] rounded-lg flex flex-col items-center justify-center cursor-pointer min-h-[300px] hover:border-sky-500/50 transition-colors">
                                        <PlusIcon className="w-8 h-8 mb-4 text-gray-400" />
                                        <span className="text-gray-400 font-bold">Thêm ảnh</span>
                                        <input type="file" multiple onChange={e => e.target.files && handleImageUpload(e.target.files)} className="hidden" accept="image/*" />
                                    </label>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center p-4">
                                   <label className="border-[3px] border-dotted border-sky-600/40 bg-black rounded-[40px] flex flex-col items-center justify-center cursor-pointer min-h-[450px] w-full max-w-4xl transition-all hover:bg-sky-950/10 group relative shadow-[0_40px_100px_rgba(2,132,199,0.15)] animate-fade-in">
                                      <div className="w-20 h-20 rounded-full border-2 border-sky-500 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(14,165,233,0.3)]">
                                          <PlusIcon className="w-10 h-10 text-sky-400" />
                                      </div>
                                      <span className="text-white text-4xl font-black uppercase tracking-tighter mb-4">
                                          {viewMode === 'background-swap' ? 'THÊM ẢNH THAY NỀN' : 
                                           viewMode === 'restoration' ? 'THÊM ẢNH PHỤC CHẾ' : 
                                           viewMode === 'painting' ? 'THÊM ẢNH VẼ NGHỆ THUẬT' : 
                                           'THÊM ẢNH CỦA BẠN'}
                                      </span>
                                      <div className="flex items-center gap-3 text-gray-500">
                                          <PhotoIcon className="w-8 h-8" />
                                          <span className="text-lg font-bold uppercase tracking-widest">HỖ TRỢ JPG, PNG, WEBP</span>
                                      </div>
                                      <input type="file" multiple onChange={e => e.target.files && handleImageUpload(e.target.files)} className="hidden" accept="image/*" />
                                      
                                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-sky-500/20 blur-[80px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                   </label>
                                </div>
                            )}
                        </>
                    )}
                  </main>
                  <aside className="w-[520px] border-l border-gray-800 bg-[#111] bg-grid">
                    <ControlPanel 
                      settings={imageSettings} 
                      onSettingsChange={setImageSettings} 
                      profileSettings={profileSettings} 
                      onProfileSettingsChange={s => setProfileSettings(p => ({...p, ...s}))} 
                      isProcessing={isImageProcessing} 
                      galleryItems={galleryItems} 
                      onDeleteFromGallery={handleDeleteFromGallery} 
                      onSelectFromGallery={handleSelectFromGallery} 
                      viewMode={viewMode} 
                      setViewMode={setViewMode} 
                      onRefineRestoration={handleRefineRestoration} 
                      onAnalyzeRestoration={handleAnalyzeRestoration} 
                      isAnalyzingRestoration={isAnalyzingRestoration}
                      onOpenDrawing={handleOpenDrawing}
                    />
                  </aside>
              </div>
            )}
        </div>
        <DonationModal isOpen={isDonationModalOpen} onClose={() => setIsDonationModalOpen(false)} />
        <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
        {renderControlGuide()}
        <CropperModal isOpen={showCropper} onClose={() => setShowCropper(false)} imageFile={imageToCrop} onSave={handleCropSave} />
        <DrawingModal isOpen={showDrawing} onClose={() => setShowDrawing(false)} imageFile={imageToDraw} onSave={handleDrawingSave} />
        {lightboxData && <Lightbox isOpen={true} src={lightboxData.src} originalSrc={lightboxData.originalSrc} onClose={() => setLightboxData(null)} />}
        <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDeleteAll} title="Xoá tất cả?" />
        <ConfirmationModal isOpen={isDownloadAllModalOpen} onClose={() => setIsDownloadAllModalOpen(false)} onConfirm={confirmDownloadAll} title="Tải tất cả?" />
    </div>
  );
};

export default App;
