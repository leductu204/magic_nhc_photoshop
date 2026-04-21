
import React, { useState } from 'react';
import { GenerationSettings, WeatherOption, StoredImage, ViewMode, ProfileSettings, ModelType, ShotType } from '../types';
import { MicrophoneIcon, XCircleIcon, ChevronDownIcon, ChevronUpIcon, PhotoIcon, ArrowPathIcon, SparklesIcon, TrashIcon, CheckIcon, BoltIcon, ChatBubbleBottomCenterTextIcon, ArchiveBoxIcon, ArrowDownTrayIcon, DocumentMagnifyingGlassIcon, EyeIcon, PlusIcon, PaintBrushIcon, ClockIcon, SpeakerWaveIcon, UserCircleIcon, AdjustmentsHorizontalIcon, ShoppingBagIcon, SwatchIcon, RocketLaunchIcon, KeyIcon, CreditCardIcon, MagnifyingGlassCircleIcon, ClipboardDocumentListIcon, IdentificationIcon, ListBulletIcon, AcademicCapIcon, FaceSmileIcon, BeakerIcon, ShieldCheckIcon, FireIcon, HeartIcon, WrenchScrewdriverIcon, VariableIcon, ScissorsIcon, SunIcon, LifebuoyIcon, FingerPrintIcon, UserIcon, MapPinIcon, PresentationChartBarIcon, ShoppingCartIcon, BuildingOffice2Icon, RectangleGroupIcon, TagIcon, ScaleIcon, HomeModernIcon, PencilIcon, BeakerIcon as LabIcon, ComputerDesktopIcon, CloudArrowDownIcon, ArrowTopRightOnSquareIcon, ExclamationTriangleIcon, SquaresPlusIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { analyzeReferenceImage } from '../services/geminiService';
import { ATTIRE_GROUPS, HAIRSTYLE_GROUPS } from '../constants';

interface ControlPanelProps {
  settings: GenerationSettings;
  onSettingsChange: (newSettings: Partial<GenerationSettings>) => void;
  profileSettings?: ProfileSettings;
  onProfileSettingsChange?: (newSettings: Partial<ProfileSettings>) => void;
  isProcessing: boolean;
  galleryItems: StoredImage[];
  onSelectFromGallery: (item: StoredImage) => void;
  onDeleteFromGallery?: (id: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onRefineRestoration?: () => void;
  onAnalyzeRestoration?: () => void;
  isAnalyzingRestoration?: boolean;
  onOpenDrawing?: () => void;
}

const ARCH_STYLES = [
    { label: 'Hiện đại (Modern)', prompt: 'Sleek modern architecture, clean lines, minimalist design, glass facades.' },
    { label: 'Bắc Âu (Scandinavian)', prompt: 'Scandinavian design, light wood textures, cozy white interiors, natural lighting.' },
    { label: 'Cổ điển (Classic)', prompt: 'Classic European architecture, ornate moldings, symmetrical proportions, luxury materials.' },
    { label: 'Đông Dương (Indochine)', prompt: 'Indochine style, tropical vibes, pattern tiles, dark wood, high ceilings.' },
    { label: 'Công nghiệp (Industrial)', prompt: 'Industrial architecture, exposed brick, concrete floors, metal structures, loft style.' },
    { label: 'Tối giản (Minimalist)', prompt: 'Ultra-minimalist architecture, monochromatic palette, open space, hidden lighting.' }
];

const PRESERVE_ORIGINAL_PROMPT = `{
  "prime_directive": "IDENTITY_LOCK_MAXIMUM. Preserve 100% of the original subject's facial identity, structure, and features. This is the highest priority rule and is non-negotiable. All other tasks are secondary to this directive.",
  "task": "ultra_high_fidelity_restoration_and_colorization",
  "priority": "absolute_identity_preservation",
  "description": "Phục chế và tô màu ảnh với chất lượng cao nhất, mô phỏng máy ảnh Phase One XF IQ4 150MP. Lệnh tối thượng là BẢO TOÀN TUYỆT ĐỐI nhận dạng và nét mặt gốc.",
  "constraints": {
    "facial_structure": {
      "rule": "Giữ nguyên 100% các nét gốc, không thay đổi. This is a hard lock.",
      "eyes": "Giữ nguyên hình dáng, kích thước và nếp mí mắt gốc. Không được thay đổi.",
      "nose": "Giữ nguyên khuôn mũi, sống mũi và cánh mũi. Không được thay đổi.",
      "mouth": "Giữ nguyên hình dạng miệng, môi trên và môi dưới. Không được thay đổi."
    },
    "modifications": "ABSOLUTELY NO modifications to facial structure are permitted.",
    "negative_constraints": [
      "DO NOT alter eye shape (e.g., from single-lid to double-lid).",
      "DO NOT slim or reshape the nose.",
      "DO NOT change the lip thickness or shape.",
      "DO NOT 'beautify' or idealize the face.",
      "DO NOT guess features that are completely obscured."
    ]
  },
  "actions": {
    "cleaning": "Làm sạch vết trầy xước, nhiễu, phục hồi mép ảnh hỏng.",
    "enhancement": "Tăng độ nét tối đa mà không làm thay đổi các đường nét gốc.",
    "colorization": {
      "skin_hair_eyes": "Thêm màu tự nhiên, trung thực, phù hợp lịch sử.",
      "clothing": "Màu sắc nhẹ nhàng, ánh sáng chân thực."
    }
  },
  "output_quality": "Phase One XF IQ4 150MP simulation"
}`;

const ULTRA_RESTO_JSON_PROMPT = `{
  "caption": "Phục chế & nâng cấp ảnh cũ – giữ background gốc, màu điện ảnh, chuẩn Phase One XF IQ4 150MP",
  "notes": "Biến ảnh cũ (kể cả ảnh chụp lại) thành ảnh màu hiện đại, sạch tuyệt đối, giữ background gốc nhưng nâng cấp đẳng cấp như chụp mới. Ưu tiên bảo toàn danh tính và pose.",
  "preprocess": {
    "detect_and_isolate_original_photo": true,
    "glare_reduction": "strict",
    "perspective_correction": true
  },
  "camera_emulation": {
    "brand_model": "Phase One XF IQ4 150MP",
    "medium_format": true,
    "look": "ultimate sharpness, maximum dynamic range, cinematic rendering"
  },
  "subject_constraints": { "keep_identity": true, "expression_policy": "preserve_original" },
  "retouching": {
    "skin": { "tone": "realistic warm neutral", "texture": "retain fine pores; avoid plastic look" },
    "repair_cracks": "strict",
    "remove_dust_scratches": "strict",
    "restore_faded_details": true
  },
  "colorization": { "style": "cinematic, natural, true-to-life", "background_colorization": "full, layered, realistic" },
  "clean_up": { "reconstruct_missing_parts": "museum-grade", "archival_quality": "museum-grade restoration" }
}`;

const CUSTOM_ULTRA_RESTO_PROMPT = `{
  "task": "ultra_high_fidelity_restoration_and_colorization",
  "identity_lock": {
    "preserve_face_structure": true,
    "preserve_expression": true,
    "preserve_age": true,
    "preserve_ethnicity": true,
    "allow_only": ["repair_damage", "enhance_clarity", "natural_colorization"]
  },
  "quality": {
    "detail_level": "maximum",
    "noise_reduction": "high",
    "texture_preservation": "high",
    "output_sharpness": "crisp_natural"
  },
  "colorization": {
    "style": "realistic_cinematic",
    "skin_tone": "natural",
    "avoid_oversaturation": true
  },
  "output_format": "Ultra-high-definition digital photograph, museum-grade restoration."
}`;

const SUPER_QUALITY_PROMPT = `Phục chế tấm ảnh cũ này với chất lượng cao: xóa vết trầy xước, bụi, vết bẩn, nếp gấp, phục hồi các vùng bị mờ, chỉnh sáng và độ tương phản, làm nét các chi tiết trên khuôn mặt, tăng cường màu sắc tự nhiên, giữ nguyên kết cấu gốc, giữ tông da chân thực, không làm da quá mịn giả. 
${ULTRA_RESTO_JSON_PROMPT}`;

const CERTIFICATE_RESTORATION_PROMPT = `Phục chế bằng khen, giấy khen hoặc chứng nhận cũ với độ chính xác cao nhất, khôi phục toàn bộ bố cục và nội dung gốc, làm rõ và sắc nét toàn bộ chữ viết, chữ in và con dấu, giữ đúng font chữ, kích thước, khoảng cách dòng và căn lề như bản gốc, phục hồi hoa văn, họa tiết, đường viền và quốc huy/logo không bị biến dạng, loại bỏ hoàn toàn vết ố vàng, vết gấp, vết rách, trầy xước, mờ nhòe và nhiễu, cân bằng ánh sáng đều toàn trang, chỉnh thẳng tài liệu, khôi phục màu giấy tự nhiên, màu mực chuẩn xác, độ tương phản cao nhưng không gắt, bảo toàn tính pháp lý và tính nguyên bản, không thêm nội dung mới, không chỉnh sửa thông tin, phong cách scan tài liệu chuyên nghiệp, ultra high resolution, super sharp, clean background, professional document restoration, 8K quality.
Phục chế bằng khen/giấy khen bị rách, nhàu nát và phai mực với độ chính xác cao nhất, tái tạo nguyên trạng tài liệu gốc, khôi phục các vùng giấy bị rách hoặc thiếu một cách liền mạch, tự nhiên, không để lộ dấu vết chỉnh sửa, làm phẳng nếp gấp và vết nhăn, loại bỏ vết ố vàng, vết bẩn và trầy xước theo thời gian, tăng độ rõ nét toàn bộ chữ viết và chữ in bị phai mực nhưng không làm thay đổi nội dung, giữ đúng font chữ, cỡ chữ, khoảng cách dòng và căn lề gốc, phục hồi con dấu, chữ ký, hoa văn, đường viền và biểu trưng rõ nét, không méo hình, không sai lệch tỷ lệ, cân bằng ánh sáng đồng đều toàn trang, khôi phục màu giấy và màu mực tự nhiên, đảm bảo tính nguyên bản, tính pháp lý và giá trị lưu trữ, phong cách phục chế tài liệu chuyên nghiệp, scan quality cao cấp, ultra high resolution, super sharp, clean background, professional document restoration, archival quality, 8K quality.`;

const FACE_FRONT_ROTATION_PROMPT = `Phục chế ảnh chân dung với độ chính xác cao, tái tạo khuôn mặt dựa hoàn toàn trên đặc điểm gốc của nhân vật, xoay góc mặt từ nghiêng hoặc lệch về chính diện một cách tự nhiên, đúng tỷ lệ giải phẫu, giữ nguyên hình dáng khuôn mặt, mắt, mũi, miệng, tai và cấu trúc xương, không thay đổi độ tuổi, giới tính hay đặc điểm nhận dạng, khôi phục chi tiết da và đường nét mềm mại, cân bằng ánh sáng hai bên khuôn mặt đồng đều, loại bỏ nhiễu, mờ và vết xước, đảm bảo ánh sáng, đổ bóng và phối cảnh nhất quán, biểu cảm tự nhiên, ánh nhìn hướng thẳng, phong cách photorealistic, ultra-realistic, sharp focus, high detail, professional photo restoration, high resolution, 8K quality.`;

const PORTRAIT_PROMPT = `IMAGE QUALITY ENHANCEMENT & RESTORE: Hyper-realistic reconstruction of a classic portrait. Convert into a modern high-quality digital portrait with vivid, fresh colors, removing all sepia/brown tones. Restore full dynamic range and contrast. Eliminate overall fading, yellowing, and discoloration.
TECHNICAL FIXES:
Clarity: Fix significant blur and softness throughout; apply advanced sharpening to all areas.
Damage Removal: Remove numerous scratches, fine lines, dust spots, and white specks. Fix emulsion damage (flaking/peeling). Clean background stains and discoloration.
Lighting: Correct heavy light glare and overexposure (especially in upper areas and background). Reduce visible grain and noise texture.
Feature Reconstruction: Sharpen and define eyes (iris/pupil details), mouth, and nose with high-resolution textures. Restore natural skin texture (smooth but realistic).
Textures: Reconstruct indistinct hair texture with natural strands. Restore clean clothing details and sharp garment outlines, ensuring all attire looks modern, xrisp, and high-quality.
Background: Clean and reconstruct the obscured background scenery while maintaining the original depth, ensuring a smooth and noise-free backdrop.
RECONSTRUCTION & PRESERVATION:
Identity: Use facial similarity and anatomical plausibility to reconstruct missing details while strictly preserving the subject's original face (99% similarity) and natural expression.
Lighting: Apply natural, modern studio lighting to enhance 3D window without altering the original presidential pose.
STYLE: Classic studio portrait photography, high-definition digital render, natural light, realistic 8k detail.

Phục chế ảnh chân dung cũ, tăng độ nét khuôn mặt, khôi phục chi tiết mắt mũi miệng tự nhiên, làm rõ làn da nhưng vẫn giữ kết cấu da thật, cân bằng ánh sáng và độ tương phản, khử nhiễu và vết xước ảnh cũ, phục hồi màu sắc chân thực (hoặc đen trắng rõ nét), giữ nguyên thần thái và nét gốc của nhân vật, không làm biến dạng khuôn mặt, phong cách chân thực, độ phân giải cao, chất lượng ảnh sắc nét, tự nhiên, không giả.`;

const MUSEUM_GRADE_RESTORATION_PROMPT = `{
"caption": "Phục chế & nâng cấp ảnh cũ – chuẩn Phase One XF IQ4 150MP",
"subject_constraints": { "keep_identity": true, "lock_features": ["eyes","nose","lips","eyebrows","jawline"] },
"retouching": { "skin": { "texture": "retain fine pores" }, "repair_cracks": "strict", "remove_dust_scratches": "strict" },
"colorization": { "style": "cinematic, natural, true-to-life" },
"clean_up": { "remove_noise": true, "reconstruct_missing_parts": "museum-grade" }
}`;

const QUICK_RESTORATION_TEMPLATES = [
    { 
        id: 'high-quality', 
        label: 'Chất lượng cao', 
        icon: SparklesIcon, 
        prompt: `Phục chế tấm ảnh cũ này with chất lượng cao: xóa vết trầy xước, bụi, vết bẩn, nếp gấp, phục hồi các vùng bị mờ, chỉnh sáng và độ tương phản, làm nét các chi tiết trên khuôn mặt, tăng cường màu sắc tự nhiên, giữ nguyên kết cấu gốc, giữ tông da chân thực, không làm da quá mịn giả.` 
    },
    { 
        id: 'real-color', 
        label: 'Tô màu chân thực', 
        icon: PaintBrushIcon, 
        prompt: `Phục chế và tô màu cho tấm ảnh đen trắng này. Hãy tái tạo màu sắc một cách chân thực và tự nhiên nhất có thể, từ màu da, tóc, đến quần áo và khung cảnh.` 
    },
    { 
        id: 'heavy-damage', 
        label: 'Hư hỏng nặng', 
        icon: WrenchScrewdriverIcon, 
        prompt: `Tái tạo lại các phần bị mất hoặc hư hỏng nặng trên ảnh này. Sử dụng các chi tiết còn lại để suy đoán và vẽ lại một cách hợp lý các vùng bị rách, mờ hoặc phai màu nghiêm trọng.` 
    },
    { 
        id: 'stain-removal', 
        label: 'Khử ố & Phai màu', 
        icon: SunIcon, 
        prompt: `Khử ố vàng và phai màu trên tấm ảnh cũ này. Phục hồi lại màu sắc gốc và tăng độ tương phản để ảnh trông rõ nét và tươi mới hơn.` 
    },
    { 
        id: 'vip-portrait', 
        label: 'Chân dung VIP', 
        icon: UserIcon, 
        prompt: `Nâng cao chất lượng ảnh chân dung này: làm mịn da một cách tự nhiên, tăng độ sắc nét cho mắt và tóc, điều chỉnh ánh sáng để làm nổi bật chủ thể và xóa phông nền nhẹ nhàng.` 
    },
    { 
        id: 'painting-restore', 
        label: 'Phục hồi Tranh', 
        icon: SwatchIcon, 
        prompt: `Phục hồi bức tranh này. Tái tạo lại các chi tiết bị mất, phai màu hoặc hư hỏng. Tăng cường màu sắc, độ tương phản và làm rõ các đường nét để bức tranh trở nên sống động và chi tiết như ban đầu.` 
    }
];

const LIFESTYLE_THEMES = [
    { id: 'paris', label: 'Du lịch Paris', prompt: 'Paris Eiffel Tower background, high-end fashion, morning light.' },
    { id: 'nyc', label: 'Thành phố New York', prompt: 'Times Square NYC street photography, urban vibe, modern style.' },
    { id: 'car', label: 'Siêu xe sang trọng', prompt: 'Inside a luxury supercar, high-tech dashboard, professional depth of field.' },
    { id: 'yacht', label: 'Du thuyền 5 sao', prompt: 'On a luxury yacht in the ocean, summer vibes, elite lifestyle.' },
    { id: 'gym', label: 'Phòng Gym hiện đại', prompt: 'In a modern high-end gym, fitness lifestyle, dramatic sports lighting.' },
    { id: 'coffee', label: 'Quán Cafe cực Chill', prompt: 'At a designer coffee shop, relaxed atmosphere, soft natural lighting.' },
    { id: 'office', label: 'Văn phòng CEO', prompt: 'Modern executive office background, city view through glass, professional atmosphere.' },
];

const MOCKUP_GROUPS = [
    {
        title: 'CỬA HÀNG & TRƯNG BÀY',
        icon: ShoppingCartIcon,
        themes: [
            { label: 'Kệ siêu thị 5 sao', prompt: 'High-end supermarket shelf, organized, professional studio lighting, depth of field.' },
            { label: 'Quầy bar sang trọng', prompt: 'Luxury hotel bar counter, ambient lighting, realistic reflections.' },
            { label: 'Showroom hiện đại', prompt: 'Minimalist product showroom, white gallery walls, clean spotlights.' }
        ]
    },
    {
        title: 'QUẢNG CÁO NGOÀI TRỜI',
        icon: BuildingOffice2Icon,
        themes: [
            { label: 'Billboard Thành phố', prompt: 'Giant outdoor billboard in a busy modern city intersection, night time, cinematic neon vibes.' },
            { label: 'Trạm chờ xe bus', prompt: 'Bus stop advertisement poster, rainy city street background, realistic glass reflections.' },
            { label: 'Banner Trung tâm thương mại', prompt: 'Large hanging banner inside a luxury shopping mall, bright architectural lighting.' }
        ]
    },
    {
        title: 'VẬT PHẨM & BAO BÌ',
        icon: RectangleGroupIcon,
        themes: [
            { label: 'Hộp quà cao cấp', prompt: 'Premium gift box packaging mockup, silk texture, soft shadows, macro photography.' },
            { label: 'Túi giấy Shopping', prompt: 'Luxury paper shopping bag on a wooden table, minimalist aesthetic.' },
            { label: 'Cốc cafe Take-away', prompt: 'Designer coffee cup mockup in a person\'s hand, urban cafe background.' }
        ]
    },
    {
        title: 'THỜI TRANG & NHÃN MÁC',
        icon: TagIcon,
        themes: [
            { label: 'Tag mác quần áo', prompt: 'High-quality clothing hang tag mockup, fabric texture background, sharp focus.' },
            { label: 'Túi vải Tote', prompt: 'Canvas tote bag mockup hanging on a wall, natural daylight, organic vibe.' },
            { label: 'Áo phông Unisex', prompt: 'T-shirt flat lay mockup, professional studio setup, high-resolution fabric details.' }
        ]
    }
];

const LIGHT_THEMES = [
    { id: 'studio', label: 'Studio Chuyên Nghiệp', prompt: 'High-end studio softbox lighting, three-point light setup, professional portrait glow.' },
    { id: 'neon', label: 'Neon Cyberpunk', prompt: 'Vibrant neon blue and hot pink lighting, cinematic cyber-noir atmosphere, dramatic glow.' },
    { id: 'golden', label: 'Golden Hour', prompt: 'Warm golden hour sunlight, low angle light, long shadows, natural warm glow.' },
    { id: 'rim', label: 'Rim Light Nghệ Thuật', prompt: 'Strong backlight creating a sharp rim of light around the subject, silhouette details.' },
    { id: 'candle', label: 'Ánh Nến Lung Linh', prompt: 'Warm flickering candle light, soft orange highlights, intimate and cozy atmosphere.' },
    { id: 'moon', label: 'Ánh Trăng Huyền Bí', prompt: 'Cool moonlight, deep blue shadows, mystical and ethereal nocturnal lighting.' },
    { id: 'fairy', label: 'Fairy Lights', prompt: 'Surrounded by magical fairy lights, soft bokeh background, sparkling warm atmosphere.' }
];

const PAINTING_STYLES = [
    { label: 'Sơn dầu (Oil Painting)', value: 'Oil Painting', prompt: 'Artistic oil painting style, rich textures, visible brushstrokes, vibrant colors, masterpiece quality.' },
    { label: 'Màu nước (Watercolor)', value: 'Watercolor', prompt: 'Soft watercolor painting style, fluid washes, delicate textures, artistic paper grain, ethereal lighting.' },
    { label: 'Phác thảo (Sketch)', value: 'Sketch', prompt: 'Professional pencil sketch, detailed graphite textures, artistic shading, hand-drawn aesthetic.' },
    { label: 'Sơn mài (Lacquer)', value: 'Lacquer', prompt: 'Traditional Vietnamese lacquer painting style, deep glossy textures, gold leaf accents, traditional aesthetic.' },
    { label: 'Ký họa (Ink Wash)', value: 'Ink Wash', prompt: 'Traditional ink wash painting, expressive brushwork, monochromatic depth, zen aesthetic.' },
    { label: 'Hoạt hình (Anime)', value: 'Anime', prompt: 'High-quality anime art style, clean lines, vibrant cel shading, expressive character design.' },
    { label: 'Phục hưng (Renaissance)', value: 'Renaissance', prompt: 'Renaissance oil painting style, chiaroscuro lighting, classical composition, museum quality.' },
    { label: 'Ấn tượng (Impressionism)', value: 'Impressionism', prompt: 'Impressionist style, short thick brushstrokes, emphasis on light and its changing qualities.' }
];

const CONCEPT_SAMPLES = [
    { label: 'Cyberpunk City', prompt: 'Cyberpunk futuristic city background, neon lights, rainy night, cinematic atmosphere, high detail.' },
    { label: 'Ancient Temple', prompt: 'Ancient mystical temple in the jungle, overgrown vines, cinematic lighting, mysterious atmosphere.' },
    { label: 'Space Station', prompt: 'Inside a futuristic space station, view of earth from window, high-tech equipment, sci-fi lighting.' },
    { label: 'Fantasy Forest', prompt: 'Magical fantasy forest, glowing plants, ethereal atmosphere, fairy tale style.' },
    { label: 'Luxury Penthouse', prompt: 'Modern luxury penthouse interior, sunset view, elegant furniture, professional photography.' },
    { label: 'Studio Portrait', prompt: 'Professional studio portrait background, soft lighting, minimalist aesthetic.' },
    { label: 'Paris Street', prompt: 'Romantic Paris street at night, Eiffel tower in background, soft street lights, cinematic bokeh.' },
    { label: 'Underwater World', prompt: 'Mystical underwater world, coral reefs, sun rays piercing through water, colorful fish, ethereal glow.' }
];

const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onSettingsChange,
  profileSettings,
  onProfileSettingsChange,
  isProcessing,
  galleryItems,
  onSelectFromGallery,
  onDeleteFromGallery,
  viewMode,
  setViewMode,
  onRefineRestoration,
  onAnalyzeRestoration,
  isAnalyzingRestoration,
  onOpenDrawing
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false); 
  const [isGalleryOpen, setIsGalleryOpen] = useState(true);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isRestoSamplesOpen, setIsRestoSamplesOpen] = useState(true);
  const [isRestoExtraOpen, setIsRestoExtraOpen] = useState(true);
  const [isConceptSamplesOpen, setIsConceptSamplesOpen] = useState(false);
  const [isConceptOriginalOpen, setIsConceptOriginalOpen] = useState(false);
  const [isConceptEffectsOpen, setIsConceptEffectsOpen] = useState(false);
  const [isConceptLightingOpen, setIsConceptLightingOpen] = useState(false);
  const [isConceptStyleOpen, setIsConceptStyleOpen] = useState(true);

  const handleOptionToggle = (key: keyof GenerationSettings) => {
      onSettingsChange({ [key]: !settings[key] } as Partial<GenerationSettings>);
  };

  const renderRestorationCheckboxes = () => {
    const restorationOptions = [
      { key: 'restoHairDetail', label: 'Vẽ lại tóc chi tiết', icon: SparklesIcon, color: 'text-yellow-400' },
      { key: 'restoClothingDetail', label: 'Vẽ lại trang phục', icon: ShoppingBagIcon, color: 'text-blue-400' },
      { key: 'restoAsianBlackHair', label: 'Người Châu Á (Tóc đen)', icon: UserIcon, color: 'text-gray-400' },
      { key: 'restoUpscaleVr2', label: 'Upscale Vr2', icon: SquaresPlusIcon, color: 'text-emerald-400' },
      { key: 'restoRealEsrgan', label: 'Real ESRGAN', icon: RocketLaunchIcon, color: 'text-orange-400' },
      { key: 'restoAdvancedNhc', label: 'PHỤC CHẾ NÂNG CAO - NHC PHOTOSHOP', icon: ShieldCheckIcon, color: 'text-red-400' },
      { key: 'restoSuperPortrait', label: 'SIÊU CHÂN DUNG', icon: FaceSmileIcon, color: 'text-pink-400' },
      { key: 'restoQualityEnhance', label: 'TĂNG CHẤT LƯỢNG', icon: SparklesIcon, color: 'text-cyan-400' },
    ];

    return (
      <div className="grid grid-cols-1 gap-2 mt-4">
        {restorationOptions.map((opt) => (
          <div 
            key={opt.key}
            className={`bg-[#151515] border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer group hover:bg-[#1a1a1a] transition-all ${settings[opt.key as keyof GenerationSettings] ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
            onClick={() => onSettingsChange({ [opt.key]: !settings[opt.key as keyof GenerationSettings] })}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors ${settings[opt.key as keyof GenerationSettings] ? 'bg-emerald-500/10' : 'bg-zinc-800'}`}>
                <opt.icon className={`w-5 h-5 ${settings[opt.key as keyof GenerationSettings] ? opt.color : 'text-zinc-600'}`} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-tight transition-colors ${settings[opt.key as keyof GenerationSettings] ? 'text-white' : 'text-gray-400'}`}>
                {opt.label}
              </span>
            </div>
            <div className={`w-10 h-5 rounded-full p-1 transition-all duration-300 relative ${settings[opt.key as keyof GenerationSettings] ? 'bg-emerald-600' : 'bg-zinc-700'}`}>
              <div className={`bg-white w-3 h-3 rounded-full shadow-md transition-all duration-300 ${settings[opt.key as keyof GenerationSettings] ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleCustomAttireUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onProfileSettingsChange) {
        const file = e.target.files[0];
        onProfileSettingsChange({
            customAttireImage: file,
            customAttirePreview: URL.createObjectURL(file)
        });
    }
  };

  const renderModelSelection = () => (
      <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl mb-6">
          <button 
            onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)} 
            className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/5 transition-all group"
          >
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 border border-sky-500/20 shadow-lg shadow-sky-900/20">
                    <RocketLaunchIcon className="w-6 h-6 text-sky-400" />
                  </div>
                  <div className="text-left">
                      <div className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] leading-none mb-1.5">MÔ HÌNH GEMINI 3.1</div>
                      <div className="text-[18px] font-black text-white uppercase leading-none tracking-tight">
                        {settings.modelType === 'nano' ? 'NANO BANANA' : 'NANO BANANA PRO'}
                      </div>
                  </div>
              </div>
              <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform duration-500 ${isModelSelectorOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isModelSelectorOpen && (
              <div className="px-6 pb-6 pt-2 space-y-6 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                      <button 
                        onClick={() => onSettingsChange({ modelType: 'nano' })}
                        className={`py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${settings.modelType === 'nano' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        Nano Banana
                      </button>
                      <button 
                        onClick={() => onSettingsChange({ modelType: 'pro-image' })}
                        className={`py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${settings.modelType === 'pro-image' ? 'bg-sky-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        Bản Pro
                      </button>
                  </div>

                  <div className="space-y-4">
                    {settings.modelType === 'pro-image' && (
                      <>
                      <h3 className="text-[16px] font-black text-sky-400 uppercase tracking-widest">KÍCH THƯỚC</h3>
                      <div className="grid grid-cols-3 gap-3">
                          {['1K', '2K', '4K'].map((size) => (
                              <button
                                  key={size}
                                  onClick={() => onSettingsChange({ imageSize: size as any, modelType: settings.modelType })}
                                  className={`py-3 rounded-xl border-2 font-black text-[14px] transition-all flex items-center justify-center ${
                                      settings.imageSize === size 
                                      ? 'bg-sky-500 border-sky-400 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]' 
                                      : 'bg-zinc-900/50 border-white/5 text-gray-500 hover:border-white/20'
                                  }`}
                              >
                                  {size}
                              </button>
                          ))}
                      </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                      <p className="text-[10px] text-gray-400 italic leading-relaxed">
                          * Bạn cần nhập hoặc chọn API Key trả phí để sử dụng mô hình {settings.modelType === 'nano' ? 'Nano Banana' : 'Nano Banana Pro'}. Xem <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className={`${settings.modelType === 'nano' ? 'text-violet-400' : 'text-sky-400'} underline hover:opacity-80`}>tài liệu thanh toán</a>.
                      </p>
                      
                      <div className="space-y-3">
                          <div className="relative group">
                              <KeyIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${settings.modelType === 'nano' ? 'text-violet-500' : 'text-sky-500'} group-focus-within:scale-110 transition-transform`} />
                              <input 
                                  type="password"
                                  value={settings.customApiKey || ''}
                                  onChange={e => onSettingsChange({ customApiKey: e.target.value })}
                                  className={`w-full bg-black/40 border-2 ${settings.modelType === 'nano' ? 'border-violet-500/20 focus:border-violet-500' : 'border-sky-500/20 focus:border-sky-500'} rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none transition-all placeholder:text-zinc-800`}
                                  placeholder="NHẬP API KEY CỦA BẠN..."
                              />
                          </div>

                          <div className="flex items-center gap-3">
                              <div className="h-[1px] flex-1 bg-white/5"></div>
                              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">HOẶC</span>
                              <div className="h-[1px] flex-1 bg-white/5"></div>
                          </div>

                          <button
                              onClick={async () => {
                                  if ((window as any).aistudio) {
                                      await (window as any).aistudio.openSelectKey();
                                  }
                              }}
                              className={`w-full py-4 ${settings.modelType === 'nano' ? 'bg-violet-500/5 border-violet-500/30 text-violet-400 hover:bg-violet-500/10' : 'bg-sky-500/5 border-sky-500/30 text-sky-400 hover:bg-sky-500/10'} border rounded-xl flex items-center justify-center gap-3 group transition-all active:scale-[0.98]`}
                          >
                              <FingerPrintIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                              <span className="text-[12px] font-black uppercase tracking-widest">CHỌN TỪ HỆ THỐNG</span>
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );

  const renderArchitectureRenderSettings = () => {
      return (
          <div className="space-y-4">
              <div className="border border-cyan-500/30 rounded-lg p-2.5 bg-[#1a1a1a] flex items-center justify-between cursor-pointer" onClick={() => onSettingsChange({ enableUpscale: !settings.enableUpscale })}>
                  <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                          <HomeModernIcon className="w-4 h-4 text-cyan-500" />
                          <span className="text-[10px] font-black text-gray-300 uppercase">Ray-Tracing (Render HD)</span>
                      </div>
                      <span className="text-[8px] text-cyan-500 font-bold uppercase tracking-tighter leading-tight">*AI Material Refinement</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.enableUpscale ? 'bg-cyan-600' : 'bg-gray-700'}`}>
                      <div className={`bg-white w-3 h-3 rounded-full transition-transform ${settings.enableUpscale ? 'translate-x-5' : ''}`} />
                  </div>
              </div>
              <div className="border border-cyan-500/30 rounded-lg p-4 bg-[#1a1a1a]">
                  <h3 className="text-sm font-black text-cyan-500 uppercase text-center mb-6 tracking-widest border-b border-cyan-500/20 pb-2">Thiết lập Render</h3>
                  <div className="space-y-6">
                      <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase block mb-3">Loại công trình</label>
                          <div className="grid grid-cols-2 gap-2">
                              {[
                                  { label: 'Nội thất', value: 'interior' },
                                  { label: 'Ngoại thất', value: 'exterior' }
                              ].map((opt) => (
                                  <button 
                                      key={opt.value} 
                                      onClick={() => onSettingsChange({ archType: opt.value as any })}
                                      className={`py-3 rounded-xl border-2 font-black text-[10px] transition-all uppercase ${settings.archType === opt.value ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-zinc-800/50 border-zinc-700 text-gray-500'}`}
                                  >
                                      {opt.label}
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase block mb-3">Phong cách thiết kế</label>
                          <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                              {ARCH_STYLES.map((style) => (
                                  <button 
                                      key={style.label} 
                                      onClick={() => onSettingsChange({ archStyle: style.label, userPrompt: style.prompt })}
                                      className={`px-4 py-3 rounded-xl border-2 font-black text-[10px] transition-all text-left uppercase flex items-center justify-between ${settings.archStyle === style.label ? 'bg-cyan-500/10 border-cyan-500 text-white' : 'bg-zinc-800/50 border-zinc-700 text-gray-500'}`}
                                  >
                                      {style.label}
                                      {settings.archStyle === style.label && <CheckIcon className="w-4 h-4 text-cyan-500" />}
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div className="border-t border-zinc-800 pt-4">
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-3 tracking-widest">Yêu cầu vật liệu/ánh sáng</label>
                          <textarea 
                              value={settings.userPrompt} 
                              onChange={e => onSettingsChange({ userPrompt: e.target.value })} 
                              placeholder="VD: Ánh sáng ban ngày, sàn gỗ sồi, tường kính..." 
                              className="w-full bg-[#111] border-2 border-zinc-800 rounded-2xl p-4 text-[11px] text-gray-200 h-28 focus:border-cyan-500 outline-none transition-all resize-none" 
                          />
                      </div>
                  </div>
              </div>
              <button onClick={onRefineRestoration} disabled={isProcessing} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-xl transition-all uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3">
                  <HomeModernIcon className="w-6 h-6" /> RENDER 3D AI PRO
              </button>
          </div>
      );
  };

  const renderBabyUltrasoundSettings = () => {
    const isUltrasoundMode = settings.babyPredictMode === 'ultrasound';
    const isClarifyTask = settings.ultrasoundTask === 'clarify';
    const isPro = settings.modelType === 'pro-image';
    return (
        <div className="space-y-4">
            <div className="flex bg-zinc-800/50 rounded-xl p-1 mb-4 border border-zinc-700">
                <button onClick={() => onSettingsChange({ babyPredictMode: 'parents' })} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${settings.babyPredictMode === 'parents' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Từ Cha Mẹ</button>
                <button onClick={() => onSettingsChange({ babyPredictMode: 'ultrasound' })} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${settings.babyPredictMode === 'ultrasound' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Từ Siêu Âm</button>
            </div>
            <div className={`border rounded-lg p-2.5 bg-[#1a1a1a] flex items-center justify-between cursor-pointer ${isUltrasoundMode ? 'border-cyan-500/30' : 'border-pink-500/30'}`} onClick={() => onSettingsChange({ enableUpscale: !settings.enableUpscale })}>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className={`w-4 h-4 ${isUltrasoundMode ? 'text-cyan-500' : 'text-pink-500'}`} />
                        <span className="text-[10px] font-black text-gray-300 uppercase">Tăng độ chân thực</span>
                    </div>
                    <span className={`text-[8px] font-bold uppercase tracking-tighter leading-tight ${isUltrasoundMode ? 'text-cyan-500' : 'text-pink-500'}`}>*AI High-Fidelity Refinement</span>
                </div>
                <div className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.enableUpscale ? (isUltrasoundMode ? 'bg-cyan-600' : 'bg-pink-600') : 'bg-gray-700'}`}>
                    <div className={`bg-white w-3 h-3 rounded-full transition-transform ${settings.enableUpscale ? 'translate-x-5' : ''}`} />
                </div>
            </div>
            {isPro && (
                <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/40 rounded-xl p-3 flex items-center gap-3 animate-pulse">
                    <ComputerDesktopIcon className="w-6 h-6 text-yellow-500" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-yellow-500 uppercase">CHẾ ĐỘ PRO 4K ULTRA</span>
                        <span className="text-[8px] text-white font-bold uppercase tracking-tighter">Bám sát rãnh môi & Cấu trúc mắt • 8K Render</span>
                    </div>
                </div>
            )}
            <div className={`border rounded-lg p-4 bg-[#1a1a1a] ${isUltrasoundMode ? 'border-cyan-500/30' : 'border-pink-500/30'}`}>
                <h3 className={`text-sm font-black uppercase text-center mb-6 tracking-widest border-b pb-2 ${isUltrasoundMode ? 'text-cyan-500 border-cyan-500/20' : 'text-pink-500 border-pink-500/20'}`}>{isUltrasoundMode ? (isClarifyTask ? 'Phục hồi Mặt Bé 4K' : 'Phân tích siêu âm') : 'Thông số dự đoán'}</h3>
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><FaceSmileIcon className="w-3.5 h-3.5" />{isClarifyTask ? 'Ưu tiên chi tiết mặt' : 'Độ bám sát chi tiết'}</label>
                            <span className={`text-xs font-black ${isUltrasoundMode ? 'text-cyan-500' : 'text-pink-500'}`}>{Math.round((settings.babyFacialDetailIntensity || 0.8) * 100)}%</span>
                        </div>
                        <input type="range" min="0.1" max="1.0" step="0.05" value={settings.babyFacialDetailIntensity || 0.8} onChange={e => onSettingsChange({ babyFacialDetailIntensity: parseFloat(e.target.value) })} className={`w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer ${isUltrasoundMode ? 'accent-cyan-500' : 'accent-pink-500'}`} />
                    </div>
                    <div className={`border rounded-xl p-3 flex flex-col gap-2 cursor-pointer transition-all ${settings.babyStrictFeatures ? 'bg-cyan-900/40 border-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.4)] ring-2 ring-cyan-500/40' : 'bg-zinc-800/40 border-zinc-700'}`} onClick={() => onSettingsChange({ babyStrictFeatures: !settings.babyStrictFeatures })}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <LabIcon className={`w-4 h-4 ${settings.babyStrictFeatures ? 'text-cyan-400' : 'text-gray-500'}`} /><span className={`text-[10px] font-black uppercase ${settings.babyStrictFeatures ? 'text-cyan-300' : 'text-gray-400'}`}>Phục dựng 1:1 Face Scan</span>
                            </div>
                            <div className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.babyStrictFeatures ? 'bg-cyan-600' : 'bg-gray-700'}`}><div className={`bg-white w-3 h-3 rounded-full transition-transform ${settings.babyStrictFeatures ? 'translate-x-5' : ''}`} /></div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className={`text-[8px] font-bold uppercase tracking-tighter ${settings.babyStrictFeatures ? 'text-white' : 'text-gray-500'}`}>Xoá mờ các phần che khuất để thấy rõ mặt bé</span>
                            <span className={`text-[7px] italic ${settings.babyStrictFeatures ? 'text-cyan-200' : 'text-gray-600'}`}>*Giữ nguyên đặc điểm mũi & môi gốc - Chế độ pháp y 4K</span>
                        </div>
                    </div>
                    {isUltrasoundMode ? (
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase block mb-3">Nhiệm vụ y tế AI</label>
                            <div className="grid grid-cols-1 gap-2">
                                {[ { label: 'Dự đoán gương mặt thực', value: 'predict-face' }, { label: 'Làm rõ & Thấy rõ mặt (Gốc)', value: 'clarify' } ].map((opt) => (
                                    <button key={opt.value} onClick={() => onSettingsChange({ ultrasoundTask: opt.value as any })} className={`px-4 py-3 rounded-xl border-2 font-black text-[10px] transition-all text-left uppercase flex items-center justify-between ${settings.ultrasoundTask === opt.value ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-zinc-800/50 border-zinc-700 text-gray-500'}`}>{opt.label}{settings.ultrasoundTask === opt.value && <CheckIcon className="w-4 h-4 text-cyan-500" />}</button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase block mb-3">Giới tính mong muốn</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[ { label: 'Bé Trai', value: 'nam' }, { label: 'Bé Gái', value: 'nu' }, { label: 'Ngẫu nhiên', value: 'ngau-nhien' } ].map((opt) => (
                                        <button key={opt.value} onClick={() => onSettingsChange({ babyGender: opt.value as any })} className={`py-2.5 rounded-xl border-2 font-black text-[9px] transition-all uppercase ${settings.babyGender === opt.value ? 'bg-pink-500/10 border-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]' : 'bg-zinc-800/50 border-zinc-700 text-gray-500'}`}>{opt.label}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase block mb-3">Phong cách hiển thị</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {[ { label: 'Ảnh chụp siêu thực', value: 'realistic' }, { label: 'Mô phỏng Siêu âm 3D/4D', value: 'ultrasound' } ].map((opt) => (
                                        <button key={opt.value} onClick={() => onSettingsChange({ babyStyle: opt.value as any })} className={`px-4 py-3 rounded-xl border-2 font-black text-[10px] transition-all text-left uppercase flex items-center justify-between ${settings.babyStyle === opt.value ? 'bg-sky-500/10 border-sky-500 text-white' : 'bg-zinc-800/50 border-zinc-700 text-gray-500'}`}>{opt.label}{settings.babyStyle === opt.value && <CheckIcon className="w-4 h-4 text-sky-500" />}</button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                    <div className="border-t border-zinc-800 pt-4">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-3 tracking-widest">Ghi chú đặc điểm (Tùy chọn)</label>
                        <textarea value={settings.userPrompt} onChange={e => onSettingsChange({ userPrompt: e.target.value })} placeholder={isUltrasoundMode ? "VD: Thấy rõ vùng miệng, giữ nguyên hốc mắt scan..." : "VD: Bé có mắt to của mẹ, mũi cao của cha..."} className={`w-full bg-[#111] border-2 border-zinc-800 rounded-2xl p-4 text-[11px] text-gray-200 h-28 outline-none transition-all resize-none ${isUltrasoundMode ? 'focus:border-cyan-500' : 'focus:border-pink-500'}`} />
                    </div>
                </div>
            </div>
            <button onClick={onRefineRestoration} disabled={isProcessing} className={`w-full text-white font-black py-4 rounded-xl transition-all uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 ${isUltrasoundMode ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-pink-600 hover:bg-pink-500'}`}>{isUltrasoundMode ? <MagnifyingGlassCircleIcon className="w-6 h-6" /> : <HeartIcon className="w-6 h-6 animate-pulse" />}{isUltrasoundMode ? (isClarifyTask ? 'PHỤC HỒI CHI TIẾT MẶT 4K' : 'LÀM RÕ SIÊU ÂM AI') : 'DỰ ĐOÁN EM BÉ AI'}</button>
        </div>
    );
  };

  const renderProfileSettings = () => {
      if (!profileSettings || !onProfileSettingsChange) return null;
      return (
          <div className="space-y-4">
              <div className="border border-zinc-700 rounded-lg p-2.5 bg-[#1a1a1a] flex items-center justify-between cursor-pointer" onClick={() => onProfileSettingsChange({ enableUpscale: !profileSettings.enableUpscale })}>
                  <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                          <AdjustmentsHorizontalIcon className="w-4 h-4 text-zinc-500" />
                          <span className="text-[10px] font-black text-gray-300 uppercase">Tăng chất lượng</span>
                      </div>
                      <span className="text-[8px] text-orange-500 font-bold uppercase tracking-tighter leading-tight">*Công nghệ CodeFormer</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full p-1 transition-colors ${profileSettings.enableUpscale ? 'bg-sky-600' : 'bg-gray-700'}`}><div className={`bg-white w-3 h-3 rounded-full transition-transform ${profileSettings.enableUpscale ? 'translate-x-5' : ''}`} /></div>
              </div>

              <div className="border border-[#ec4899]/30 rounded-lg p-4 bg-[#1a1a1a] relative overflow-hidden">
                  <h3 className="text-sm font-black text-[#ec4899] uppercase text-center mb-6 tracking-widest">Tùy chỉnh hồ sơ</h3>
                  <div className="space-y-6">
                      <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-3">Giới tính</label>
                          <div className="flex gap-2">
                              <button onClick={() => onProfileSettingsChange({ gender: 'nam' })} className={`flex-1 py-3 rounded-full border-2 font-black text-xs transition-all ${profileSettings.gender === 'nam' ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-[#1a1a1a] border-zinc-700 text-gray-500'}`}>Nam</button>
                              <button onClick={() => onProfileSettingsChange({ gender: 'nu' })} className={`flex-1 py-3 rounded-full border-2 font-black text-xs transition-all ${profileSettings.gender === 'nu' ? 'bg-[#ec4899] border-[#ec4899] text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'bg-[#1a1a1a] border-zinc-700 text-gray-500'}`}>Nữ</button>
                              <button onClick={() => onProfileSettingsChange({ gender: 'auto' as any })} className={`flex-1 py-3 rounded-full border-2 font-black text-xs transition-all ${profileSettings.gender === 'auto' ? 'bg-emerald-600 border-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-[#1a1a1a] border-zinc-700 text-gray-500'}`}>Tự động</button>
                          </div>
                      </div>

                      <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-4">
                          <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
                                  <Squares2X2Icon className="w-4 h-4" /> Tạo ảnh hàng loạt
                              </label>
                              <span className="text-[10px] font-black text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-md">{profileSettings.batchCount || 1} ẢNH</span>
                          </div>
                          <div className="flex gap-2">
                              {[1, 2, 3, 4].map(num => (
                                  <button
                                      key={num}
                                      onClick={() => onProfileSettingsChange({ batchCount: num } as any)}
                                      className={`flex-1 py-2 rounded-xl border-2 font-black text-[10px] transition-all ${profileSettings.batchCount === num ? 'bg-sky-600 border-sky-500 text-white shadow-lg' : 'bg-black/40 border-zinc-800 text-gray-500 hover:border-zinc-700'}`}
                                  >
                                      {num}
                                  </button>
                              ))}
                          </div>
                          <p className="text-[8px] text-gray-500 italic text-center">*Tự động tạo nhiều biến thể ảnh hồ sơ cùng lúc</p>
                      </div>

                      <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-3">Đối tượng</label>
                          <div className="flex flex-wrap gap-2">
                              {[
                                  { label: 'Người lớn', value: 'nguoi-lon' },
                                  { label: 'Thanh niên', value: 'thanh-nien' },
                                  { label: 'Trẻ em', value: 'tre-em' }
                              ].map((opt) => {
                                  const isActive = profileSettings.subject === opt.value;
                                  return (
                                    <button key={opt.value} onClick={() => onProfileSettingsChange({ subject: opt.value as any })} className={`px-5 py-2 rounded-full border-2 font-black text-[10px] transition-all uppercase ${isActive ? 'bg-[#4caf50] border-[#4caf50] text-white shadow-[0_0_15px_rgba(76,175,80,0.3)]' : 'bg-[#1a1a1a] border-zinc-700 text-gray-500'}`}>{opt.label}</button>
                                  );
                              })}
                          </div>
                      </div>

                      <div className="space-y-4">
                          <label className="text-[10px] font-black text-orange-400 uppercase block tracking-widest">Trang phục</label>
                          {ATTIRE_GROUPS.map(group => (
                              <div key={group.title} className="space-y-2 pl-2 border-l border-zinc-800">
                                  <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">{group.title}</span>
                                  <div className="flex flex-wrap gap-2">
                                      {group.options.map(opt => {
                                          const isActive = profileSettings.attire === opt;
                                          return (
                                            <button key={opt} onClick={() => profileSettings.attire === opt ? onProfileSettingsChange({ attire: 'GIỮ NGUYÊN' }) : onProfileSettingsChange({ attire: opt })} className={`px-3 py-1.5 rounded-lg border-2 font-black text-[9px] transition-all uppercase ${isActive ? 'bg-[#fff176] border-[#fff176] text-black shadow-md' : 'bg-[#1a1a1a] border-zinc-700 text-gray-400'}`}>{opt}</button>
                                          );
                                      })}
                                  </div>
                              </div>
                          ))}
                          {profileSettings.attire === 'TÙY CHỈNH' && (
                              <div className="p-3 bg-zinc-800/40 border border-orange-500/30 rounded-xl space-y-3 animate-fade-in">
                                  <div className="flex items-center justify-between mb-1">
                                      <span className="text-[9px] font-black text-orange-400 uppercase">Tải trang phục mẫu</span>
                                      {profileSettings.customAttirePreview && (<button onClick={() => onProfileSettingsChange({ customAttireImage: null, customAttirePreview: null })} className="text-[8px] font-black text-red-500 uppercase border border-red-500/30 px-2 py-0.5 rounded hover:bg-red-500/10">Xóa ảnh</button>)}
                                  </div>
                                  <label className={`relative block border-2 border-dashed rounded-lg h-32 overflow-hidden cursor-pointer hover:bg-zinc-800 transition-all ${profileSettings.customAttirePreview ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'border-zinc-700'}`}>
                                      {profileSettings.customAttirePreview ? (<img src={profileSettings.customAttirePreview} className="w-full h-full object-contain" alt="Custom Attire" />) : (<div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500"><ShoppingBagIcon className="w-8 h-8 text-orange-500/50 mb-1" /><span className="text-[9px] font-black uppercase tracking-tighter">Chọn ảnh mẫu đồ</span></div>)}
                                      <input type="file" className="hidden" onChange={handleCustomAttireUpload} accept="image/*" />
                                  </label>
                                  <p className="text-[8px] text-gray-500 italic">*Tải ảnh mẫu quần áo bạn muốn AI mặc cho bạn</p>
                              </div>
                          )}
                      </div>

                      <div className="space-y-4">
                          <label className="text-[10px] font-black text-[#ec4899] uppercase block tracking-widest">Kiểu tóc</label>
                          {HAIRSTYLE_GROUPS.map(group => (
                              <div key={group.title} className="space-y-2 pl-2 border-l border-zinc-800">
                                  <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">{group.title}</span>
                                  <div className="flex flex-wrap gap-2">
                                      {group.options.map(opt => {
                                          const isActive = profileSettings.hairstyle === opt || profileSettings.hairColor === opt;
                                          return (
                                            <button key={opt} onClick={() => group.title === 'MÀU TÓC' ? onProfileSettingsChange({ hairColor: opt }) : onProfileSettingsChange({ hairstyle: opt })} className={`px-3 py-1.5 rounded-lg border-2 font-black text-[9px] transition-all uppercase ${isActive ? 'bg-[#fce4ec] border-[#fce4ec] text-black shadow-md' : 'bg-[#1a1a1a] border-zinc-700 text-gray-400'}`}>{opt}</button>
                                          );
                                      })}
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div>
                          <label className="text-[10px] font-black text-orange-400 uppercase block mb-3 tracking-widest">Màu nền</label>
                          <div className="flex flex-wrap gap-2 mb-3">
                              {['GIỮ NGUYÊN', 'XANH', 'TRẮNG', 'XÁM', 'TÙY CHỈNH'].map(bg => {
                                  const isActive = profileSettings.background === bg;
                                  return (
                                    <button key={bg} onClick={() => onProfileSettingsChange({ background: bg, customBackgroundColor: bg === 'TÙY CHỈNH' ? (profileSettings.customBackgroundColor || '#3b82f6') : profileSettings.customBackgroundColor })} className={`px-5 py-2 rounded-full border-2 font-black text-[9px] transition-all uppercase ${isActive ? 'bg-[#ffe0b2] border-[#ffe0b2] text-black shadow-md' : 'bg-[#1a1a1a] border-zinc-700 text-gray-500'}`}>{bg}</button>
                                  );
                              })}
                          </div>
                          {profileSettings.background === 'TÙY CHỈNH' && (
                              <div className="flex items-center gap-4 p-3 bg-black/30 rounded-xl border border-zinc-800 animate-fade-in">
                                  <div className="relative w-10 h-10 rounded-full border border-white/20 overflow-hidden"><input type="color" value={profileSettings.customBackgroundColor || '#3b82f6'} onChange={e => onProfileSettingsChange({ customBackgroundColor: e.target.value })} className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer" /></div>
                                  <div className="flex flex-col"><span className="text-[9px] font-black text-gray-500 uppercase">Mã màu chọn:</span><span className="text-xs font-mono font-bold text-orange-400 uppercase">{profileSettings.customBackgroundColor || '#3B82F6'}</span></div>
                              </div>
                          )}
                      </div>

                      <div>
                          <div className="flex justify-between items-center mb-1">
                              <label className="text-[10px] font-black text-[#10b981] uppercase tracking-tighter">Làm đẹp da (AI)</label>
                              <div className="flex items-center gap-1"><span className="text-[10px] font-black text-[#10b981]">{profileSettings.beautifyLevel}%</span><SparklesIcon className="w-3 h-3 text-[#10b981]" /></div>
                          </div>
                          <input type="range" min="0" max="100" value={profileSettings.beautifyLevel} onChange={e => onProfileSettingsChange({ beautifyLevel: parseInt(e.target.value) })} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#10b981]" />
                      </div>

                      <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-3">Yêu cầu thêm</label>
                          <textarea value={profileSettings.customPrompt} onChange={e => onProfileSettingsChange({ customPrompt: e.target.value })} placeholder="VD: Đeo kính, thêm nốt ruồi..." className="w-full bg-[#111] border-2 border-zinc-800 rounded-2xl p-4 text-[11px] text-gray-200 h-28 focus:border-[#ec4899] outline-none transition-all resize-none" />
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderFaceStraightenSettings = () => {
    return (
        <div className="space-y-4">
            <div className="border border-yellow-500/30 rounded-lg p-4 bg-[#1a1a1a]">
                <h3 className="text-sm font-black text-yellow-500 uppercase text-center mb-4 tracking-widest border-b border-yellow-500/20 pb-2">Căn chỉnh thẳng mặt</h3>
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Độ chính xác căn chỉnh</label><span className="text-xs font-black text-yellow-500">{Math.round((settings.straightenIntensity || 1.0) * 100)}%</span></div>
                        <input type="range" min="0" max="1" step="0.1" value={settings.straightenIntensity || 1.0} onChange={e => onSettingsChange({ straightenIntensity: parseFloat(e.target.value) })} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-3">Tùy chọn hướng nhìn</label>
                        <div className="grid grid-cols-1 gap-2">
                            {[ { label: 'Nhìn thẳng trực diện', prompt: 'Frontal face orientation, eyes looking at camera.' }, { label: 'Góc 3/4 chuyên nghiệp', prompt: '3/4 facial angle, professional portrait symmetry.' }, { label: 'Giữ góc nghiêng nghệ thuật', prompt: 'Preserve natural artistic head tilt while balancing symmetry.' } ].map((opt, i) => (
                                <button key={i} onClick={() => onSettingsChange({ userPrompt: opt.prompt })} className={`px-4 py-3 rounded-xl border-2 font-bold text-[10px] transition-all text-left uppercase ${settings.userPrompt === opt.prompt ? 'bg-yellow-500/10 border-yellow-500 text-white' : 'bg-zinc-800/50 border-zinc-700 text-gray-500'}`}>{opt.label}</button>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-zinc-800 pt-4">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Yêu cầu bổ sung</label>
                        <textarea value={settings.userPrompt} onChange={e => onSettingsChange({ userPrompt: e.target.value })} placeholder="VD: Làm gọn cằm, cân bằng lông mày..." className="w-full bg-[#111] border-2 border-zinc-800 rounded-2xl p-4 text-[11px] text-gray-200 h-24 focus:border-yellow-500 outline-none transition-all resize-none" />
                    </div>
                </div>
            </div>
            <button onClick={onRefineRestoration} disabled={isProcessing} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-4 rounded-xl transition-all uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3"><CheckIcon className="w-5 h-5" /> BẮT ĐẦU CĂN CHỈNH THẲNG MẶT</button>
        </div>
    );
  };

  const renderLifestyleSettings = () => {
      return (
          <div className="space-y-4">
              <div className="border border-emerald-500/30 rounded-lg p-2.5 bg-[#1a1a1a] flex items-center justify-between cursor-pointer" onClick={() => onSettingsChange({ enableUpscale: !settings.enableUpscale })}>
                  <div className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-emerald-500" /><span className="text-[10px] font-black text-gray-300 uppercase">Tăng chất lượng</span></div>
                  <div className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.enableUpscale ? 'bg-emerald-600' : 'bg-gray-700'}`}><div className={`bg-white w-3 h-3 rounded-full transition-transform ${settings.enableUpscale ? 'translate-x-5' : ''}`} /></div>
              </div>
              <div className="border border-emerald-500/30 rounded-lg p-4 bg-[#1a1a1a]">
                  <h3 className="text-sm font-black text-emerald-500 uppercase text-center mb-6 tracking-widest border-b border-emerald-500/20 pb-2">Chủ đề sống ảo</h3>
                  <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-2">
                          {LIFESTYLE_THEMES.map((theme) => {
                              const isActive = settings.lifestyleTheme === theme.label;
                              return (<button key={theme.id} onClick={() => onSettingsChange({ lifestyleTheme: theme.label, userPrompt: theme.prompt })} className={`px-4 py-3 rounded-xl border-2 font-black text-[10px] transition-all text-left uppercase flex items-center justify-between ${isActive ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-zinc-800/50 border-zinc-700 text-gray-500'}`}>{theme.label}{isActive && <CheckIcon className="w-4 h-4 text-emerald-500" />}</button>);
                          })}
                      </div>
                      <div className="border-t border-zinc-800 pt-4"><label className="text-[10px] font-bold text-gray-500 uppercase block mb-3 tracking-widest">Tùy chỉnh bối cảnh</label><textarea value={settings.userPrompt} onChange={e => onSettingsChange({ userPrompt: e.target.value })} placeholder="Mô tả bối cảnh cụ thể bạn muốn..." className="w-full bg-[#111] border-2 border-zinc-800 rounded-2xl p-4 text-[11px] text-gray-200 h-32 focus:border-emerald-500 outline-none transition-all resize-none" /></div>
                  </div>
              </div>
              <button onClick={onRefineRestoration} disabled={isProcessing} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl transition-all uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3"><MapPinIcon className="w-5 h-5" /> TẠO ẢNH SỐNG ẢO AI</button>
          </div>
      );
  };

  const renderMockupSettings = () => {
    return (
        <div className="space-y-4">
            <div className="border border-amber-500/30 rounded-lg p-2.5 bg-[#1a1a1a] flex items-center justify-between cursor-pointer" onClick={() => onSettingsChange({ enableUpscale: !settings.enableUpscale })}>
                <div className="flex items-center gap-2"><PresentationChartBarIcon className="w-4 h-4 text-amber-500" /><span className="text-[10px] font-black text-gray-300 uppercase">Độ chi tiết cao</span></div>
                <div className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.enableUpscale ? 'bg-amber-600' : 'bg-gray-700'}`}><div className={`bg-white w-3 h-3 rounded-full transition-transform ${settings.enableUpscale ? 'translate-x-5' : ''}`} /></div>
            </div>
            <div className="border border-amber-500/30 rounded-lg p-4 bg-[#1a1a1a]">
                <h3 className="text-sm font-black text-amber-500 uppercase text-center mb-6 tracking-widest border-b border-amber-500/20 pb-2">Lựa chọn môi trường</h3>
                <div className="space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {MOCKUP_GROUPS.map((group) => (
                        <div key={group.title} className="space-y-3">
                            <div className="flex items-center gap-2 border-b border-zinc-800 pb-1"><group.icon className="w-4 h-4 text-zinc-500" /><span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{group.title}</span></div>
                            <div className="grid grid-cols-1 gap-2">
                                {group.themes.map((theme) => {
                                    const isActive = settings.mockupTheme === theme.label;
                                    return (<button key={theme.label} onClick={() => onSettingsChange({ mockupTheme: theme.label, userPrompt: theme.prompt })} className={`px-4 py-2.5 rounded-xl border-2 font-bold text-[9px] transition-all text-left uppercase flex items-center justify-between ${isActive ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-zinc-800/50 border-zinc-700 text-gray-500'}`}>{theme.label}{isActive && <CheckIcon className="w-3 h-3 text-amber-500" />}</button>);
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="border-t border-zinc-800 pt-4 mt-4"><label className="text-[10px] font-bold text-gray-500 uppercase block mb-3 tracking-widest">Yêu cầu bố cục đặc biệt</label><textarea value={settings.userPrompt} onChange={e => onSettingsChange({ userPrompt: e.target.value })} placeholder="VD: Đặt nghiêng 45 độ, ánh sáng vàng ấm..." className="w-full bg-[#111] border-2 border-zinc-800 rounded-2xl p-4 text-[11px] text-gray-200 h-28 focus:border-amber-500 outline-none transition-all resize-none" /></div>
            </div>
            <button onClick={onRefineRestoration} disabled={isProcessing} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-4 rounded-xl transition-all uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3"><PresentationChartBarIcon className="w-5 h-5" /> TẠO MOCKUP BÁN HÀNG AI</button>
        </div>
    );
  };

  const renderLightingEffectSettings = () => {
    return (
        <div className="space-y-4">
            <div className="border border-orange-500/30 rounded-lg p-2.5 bg-[#1a1a1a] flex items-center justify-between cursor-pointer" onClick={() => onSettingsChange({ enableUpscale: !settings.enableUpscale })}>
                <div className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-orange-500" /><span className="text-[10px] font-black text-gray-300 uppercase">Tăng chất lượng</span></div>
                <div className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.enableUpscale ? 'bg-orange-600' : 'bg-gray-700'}`}><div className={`bg-white w-3 h-3 rounded-full transition-transform ${settings.enableUpscale ? 'translate-x-5' : ''}`} /></div>
            </div>
            <div className="border border-orange-500/30 rounded-lg p-4 bg-[#1a1a1a]">
                <h3 className="text-sm font-black text-orange-500 uppercase text-center mb-6 tracking-widest border-b border-orange-500/20 pb-2">Chọn phong cách ánh sáng</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                        {LIGHT_THEMES.map((theme) => {
                            const isActive = settings.lightTheme === theme.label;
                            return (<button key={theme.id} onClick={() => onSettingsChange({ lightTheme: theme.label, userPrompt: theme.prompt })} className={`px-4 py-3 rounded-xl border-2 font-black text-[10px] transition-all text-left uppercase flex items-center justify-between ${isActive ? 'bg-orange-500/10 border-orange-500 text-white' : 'bg-zinc-800/50 border-zinc-700 text-gray-500'}`}>{theme.label}{isActive && <CheckIcon className="w-4 h-4 text-orange-500" />}</button>);
                        })}
                    </div>
                    <div className="border-t border-zinc-800 pt-4">
                        <div className="flex justify-between items-center mb-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cường độ ánh sáng</label><span className="text-xs font-black text-orange-500">{Math.round((settings.lightIntensity || 0.8) * 100)}%</span></div>
                        <input type="range" min="0.1" max="1.5" step="0.1" value={settings.lightIntensity || 0.8} onChange={e => onSettingsChange({ lightIntensity: parseFloat(e.target.value) })} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                    </div>
                    <div className="border-t border-zinc-800 pt-4">
                        <button 
                            onClick={onOpenDrawing}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 py-3 rounded-xl border border-white/5 flex items-center justify-center gap-3 transition-all group"
                        >
                            <PencilIcon className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] font-black uppercase tracking-widest">Vẽ vùng cần chiếu sáng</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">Tô màu vào nơi muốn ánh sáng tập trung</span>
                            </div>
                        </button>
                    </div>
                    <div className="border-t border-zinc-800 pt-4"><label className="text-[10px] font-bold text-gray-400 uppercase block mb-3 tracking-widest">Yêu cầu chi tiết</label><textarea value={settings.userPrompt} onChange={e => onSettingsChange({ userPrompt: e.target.value })} placeholder="Mô tả hướng sáng, màu sắc cụ thể..." className="w-full bg-[#111] border-2 border-zinc-800 rounded-2xl p-4 text-[11px] text-gray-200 h-28 focus:border-orange-500 outline-none transition-all resize-none" /></div>
                </div>
            </div>
            <button onClick={onRefineRestoration} disabled={isProcessing} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-xl transition-all uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3"><SunIcon className="w-5 h-5" /> ÁP DỤNG ÁNH SÁNG AI</button>
        </div>
    );
  };

  const renderUpscaleExpandSettings = () => {
    return (
        <div className="space-y-6">
            <div 
              className="bg-[#151515] border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer group hover:bg-[#1a1a1a] transition-all" 
              onClick={() => onSettingsChange({ enableUpscale: !settings.enableUpscale })}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${settings.enableUpscale ? 'bg-blue-500/10' : 'bg-zinc-800'}`}>
                  <SparklesIcon className={`w-5 h-5 ${settings.enableUpscale ? 'text-blue-400' : 'text-zinc-600'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-gray-300 uppercase tracking-tight">Tăng độ nét (Upscale)</span>
                  <span className="text-[9px] text-blue-500/80 font-bold uppercase tracking-tighter leading-tight">Ultra HD Engine</span>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full p-1 transition-all duration-300 relative ${settings.enableUpscale ? 'bg-blue-600' : 'bg-zinc-700'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-all duration-300 ${settings.enableUpscale ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            <div className="bg-[#151515] border border-white/5 rounded-3xl p-6 shadow-xl">
                <h3 className="text-xs font-black text-blue-400 uppercase text-center mb-8 tracking-[0.2em] border-b border-white/5 pb-4">Làm nét & Mở rộng ảnh</h3>
                
                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cường độ làm nét & Nâng cấp</label>
                          <span className="text-xs font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-lg">{Math.round((settings.upscaleIntensity || 0.8) * 100)}%</span>
                        </div>
                        <input 
                          type="range" min="0.1" max="1.5" step="0.1" 
                          value={settings.upscaleIntensity || 0.8} 
                          onChange={e => onSettingsChange({ upscaleIntensity: parseFloat(e.target.value) })} 
                          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-4 tracking-widest">Hướng mở rộng (Outpainting)</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Tất cả các hướng', value: 'all' },
                                { label: 'Mở rộng sang trái', value: 'left' },
                                { label: 'Mở rộng sang phải', value: 'right' },
                                { label: 'Mở rộng lên trên', value: 'top' },
                                { label: 'Mở rộng xuống dưới', value: 'bottom' },
                                { label: 'Chỉ làm nét', value: 'none' }
                            ].map((opt) => (
                                <button 
                                  key={opt.value} 
                                  onClick={() => onSettingsChange({ expandDirection: opt.value as any })} 
                                  className={`px-4 py-3 rounded-2xl border-2 font-black text-[10px] transition-all text-left uppercase flex items-center justify-between group ${settings.expandDirection === opt.value ? 'bg-blue-500/10 border-blue-500 text-white shadow-lg shadow-blue-900/20' : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/10'}`}
                                >
                                  {opt.label}
                                  {settings.expandDirection === opt.value && <CheckIcon className="w-4 h-4 text-blue-400" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <label className="text-[10px] font-black text-gray-500 uppercase block mb-4 tracking-widest">Yêu cầu chi tiết mở rộng</label>
                        <textarea 
                            value={settings.userPrompt} 
                            onChange={e => onSettingsChange({ userPrompt: e.target.value })} 
                            placeholder="VD: Thêm cây cối ở hai bên, mở rộng bầu trời xanh..." 
                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[11px] text-gray-200 h-32 focus:border-blue-500/50 outline-none transition-all resize-none placeholder:text-gray-700" 
                        />
                    </div>
                </div>
            </div>

            <button 
                onClick={onRefineRestoration} 
                disabled={isProcessing} 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4.5 rounded-2xl transition-all uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-900/30 flex items-center justify-center gap-3 active:scale-95 group"
            >
                <SquaresPlusIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" /> BẮT ĐẦU NÂNG CẤP & MỞ RỘNG
            </button>
        </div>
    );
  };

  const renderRemoveBackgroundSettings = () => {
      return (
          <div className="space-y-6">
              <div className="bg-[#151515] border border-white/5 rounded-3xl p-1.5 flex gap-1">
                  <button 
                    onClick={() => onSettingsChange({ removeBackgroundMode: 'remove-bg' })}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${settings.removeBackgroundMode === 'remove-bg' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Xóa nền AI
                  </button>
                  <button 
                    onClick={() => onSettingsChange({ removeBackgroundMode: 'clean-bg' })}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${settings.removeBackgroundMode === 'clean-bg' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Làm sạch nền
                  </button>
                  <button 
                    onClick={() => onSettingsChange({ removeBackgroundMode: 'remove-object' })}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${settings.removeBackgroundMode === 'remove-object' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Xóa vật thể
                  </button>
              </div>

              {settings.removeBackgroundMode === 'remove-object' ? (
                  <div className="bg-[#151515] border border-white/5 rounded-3xl p-6 shadow-xl space-y-6">
                      <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20">
                              <PaintBrushIcon className="w-8 h-8 text-indigo-400" />
                          </div>
                          <div className="text-center">
                              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">Xóa vật thể bằng cọ</h3>
                              <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                                  Dùng cọ tô màu vào người hoặc vật thể bạn muốn xóa khỏi ảnh. Hệ thống AI sẽ tự động lấp đầy vùng trống một cách tự nhiên.
                              </p>
                          </div>
                          <button 
                            onClick={onOpenDrawing}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-2xl text-[11px] font-black text-indigo-400 uppercase tracking-widest transition-all flex items-center justify-center gap-3 group"
                          >
                            <PaintBrushIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Bắt đầu tô vùng xóa
                          </button>
                      </div>
                  </div>
              ) : settings.removeBackgroundMode === 'clean-bg' ? (
                  <div className="space-y-6">
                      <div className="bg-[#151515] border border-white/5 rounded-3xl p-6 shadow-xl space-y-6">
                          <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20">
                                  <SparklesIcon className="w-8 h-8 text-indigo-400" />
                              </div>
                              <div className="text-center">
                                  <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">Làm sạch nền AI</h3>
                                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                                      Hệ thống sẽ phân tích và làm sạch các chi tiết thừa, nhiễu hoặc các vật thể nhỏ không mong muốn ở phông nền, giúp chủ thể nổi bật hơn.
                                  </p>
                              </div>
                              <div className="w-full space-y-4">
                                  <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Độ làm sạch</span>
                                      <span className="text-[10px] font-black text-indigo-400">{(settings.cleanBgIntensity || 0.85) >= 0.8 ? 'MẠNH' : (settings.cleanBgIntensity || 0.85) >= 0.5 ? 'TRUNG BÌNH' : 'NHẸ'}</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="0.1" 
                                    max="1.0" 
                                    step="0.05" 
                                    value={settings.cleanBgIntensity || 0.85} 
                                    onChange={(e) => onSettingsChange({ cleanBgIntensity: parseFloat(e.target.value) })}
                                    className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                                  />
                              </div>
                          </div>
                      </div>

                      <div className="bg-[#151515] border border-white/5 rounded-3xl p-6 shadow-xl space-y-5">
                          <h3 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                              <AdjustmentsHorizontalIcon className="w-4 h-4 text-indigo-400" /> Công cụ chỉnh sửa chuyên nghiệp
                          </h3>
                          <div className="space-y-3">
                              {[
                                  { key: 'cleanBgRemoveDetails', label: 'Tẩy các chi tiết thừa' },
                                  { key: 'cleanBgEvenColor', label: 'Làm đều màu phông' },
                                  { key: 'cleanBgReduceNoise', label: 'Giảm Noise/Nhiễu hạt' },
                                  { key: 'cleanBgSharpen', label: 'Tăng độ nét phông' }
                              ].map((item) => (
                                  <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                                      <div className="relative flex items-center">
                                          <input 
                                              type="checkbox" 
                                              checked={!!(settings as any)[item.key]} 
                                              onChange={(e) => onSettingsChange({ [item.key]: e.target.checked } as Partial<GenerationSettings>)}
                                              className="sr-only"
                                          />
                                          <div className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${ (settings as any)[item.key] ? 'bg-indigo-600 border-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'bg-black/40 border-white/10 group-hover:border-white/20' }`}>
                                              { (settings as any)[item.key] && <CheckIcon className="w-3.5 h-3.5 text-white stroke-[3px]" /> }
                                          </div>
                                      </div>
                                      <span className={`text-[11px] font-bold transition-colors ${ (settings as any)[item.key] ? 'text-gray-200' : 'text-gray-500 group-hover:text-gray-400' }`}>
                                          {item.label}
                                      </span>
                                  </label>
                              ))}
                          </div>
                      </div>

                      <div className="bg-[#151515] border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
                          <h3 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                              <PencilIcon className="w-4 h-4 text-indigo-400" /> Tùy chỉnh thêm
                          </h3>
                          <textarea 
                              value={settings.cleanBgCustomPrompt || ''}
                              onChange={(e) => onSettingsChange({ cleanBgCustomPrompt: e.target.value })}
                              placeholder="VD: làm cho màu xanh của nền đậm hơn một chút..."
                              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[11px] text-gray-200 h-24 focus:border-indigo-500/50 outline-none resize-none transition-all placeholder:text-gray-700"
                          />
                      </div>
                  </div>
              ) : (
                  <>
                    <div 
                        className="bg-[#151515] border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer group hover:bg-[#1a1a1a] transition-all" 
                        onClick={() => onSettingsChange({ enableUpscale: !settings.enableUpscale })}
                    >
                        <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${settings.enableUpscale ? 'bg-indigo-500/10' : 'bg-zinc-800'}`}>
                            <ScissorsIcon className={`w-5 h-5 ${settings.enableUpscale ? 'text-indigo-400' : 'text-zinc-600'}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-gray-300 uppercase tracking-tight">Làm sạch cạnh</span>
                            <span className="text-[9px] text-indigo-500/80 font-bold uppercase tracking-tighter leading-tight">Edge Cleanup AI</span>
                        </div>
                        </div>
                        <div className={`w-11 h-6 rounded-full p-1 transition-all duration-300 relative ${settings.enableUpscale ? 'bg-indigo-600' : 'bg-zinc-700'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-all duration-300 ${settings.enableUpscale ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    <div className="bg-[#151515] border border-white/5 rounded-3xl p-6 shadow-xl">
                        <h3 className="text-xs font-black text-indigo-400 uppercase text-center mb-8 tracking-[0.2em] border-b border-white/5 pb-4">Tùy chọn xóa nền</h3>
                        
                        <div className="space-y-6">
                            <div className="p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                                <p className="text-[11px] text-gray-400 font-medium leading-relaxed italic text-center">
                                Hệ thống sẽ tự động nhận diện chủ thể chính và thay thế toàn bộ nền bằng màu trắng tinh khiết, lý tưởng cho ảnh thương mại điện tử hoặc hồ sơ cá nhân.
                                </p>
                            </div>
                            
                            <div className="pt-4 border-t border-white/5">
                                <label className="text-[10px] font-black text-gray-500 uppercase block mb-4 tracking-widest">Thông tin bổ sung về cạnh</label>
                                <textarea 
                                value={settings.userPrompt} 
                                onChange={e => onSettingsChange({ userPrompt: e.target.value })} 
                                placeholder="VD: Chú ý phần tóc xoăn, làm sạch viền áo..." 
                                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[11px] text-gray-200 h-32 focus:border-indigo-500/50 outline-none transition-all resize-none placeholder:text-gray-700" 
                                />
                            </div>
                        </div>
                    </div>
                  </>
              )}

              <button 
                onClick={onRefineRestoration} 
                disabled={isProcessing} 
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4.5 rounded-2xl transition-all uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-900/30 flex items-center justify-center gap-3 active:scale-95 group"
              >
                <ScissorsIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" /> 
                {settings.removeBackgroundMode === 'remove-object' ? 'THỰC HIỆN XÓA VẬT THỂ AI' : settings.removeBackgroundMode === 'clean-bg' ? 'THỰC HIỆN LÀM SẠCH NỀN AI' : 'THỰC HIỆN XÓA NỀN AI'}
              </button>
          </div>
      );
  };

  const renderSymmetricEditSettings = () => {
    return (
        <div className="space-y-6">
            <div 
              className="bg-[#151515] border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer group hover:bg-[#1a1a1a] transition-all" 
              onClick={() => onSettingsChange({ enableUpscale: !settings.enableUpscale })}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${settings.enableUpscale ? 'bg-violet-500/10' : 'bg-zinc-800'}`}>
                  <ScaleIcon className={`w-5 h-5 ${settings.enableUpscale ? 'text-violet-400' : 'text-zinc-600'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-gray-300 uppercase tracking-tight">Tăng cường cấu trúc</span>
                  <span className="text-[9px] text-violet-500/80 font-bold uppercase tracking-tighter leading-tight">Golden Ratio AI</span>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full p-1 transition-all duration-300 relative ${settings.enableUpscale ? 'bg-violet-600' : 'bg-zinc-700'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-all duration-300 ${settings.enableUpscale ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            <div className="bg-[#151515] border border-white/5 rounded-3xl p-6 shadow-xl">
                <h3 className="text-xs font-black text-violet-400 uppercase text-center mb-8 tracking-[0.2em] border-b border-white/5 pb-4">Thông số cân đối</h3>
                
                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cường độ đối xứng</label>
                          <span className="text-xs font-black text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-lg">{Math.round((settings.symmetryIntensity || 0.8) * 100)}%</span>
                        </div>
                        <input 
                          type="range" min="0.1" max="1.0" step="0.1" 
                          value={settings.symmetryIntensity || 0.8} 
                          onChange={e => onSettingsChange({ symmetryIntensity: parseFloat(e.target.value) })} 
                          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500" 
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase block mb-4 tracking-widest">Chế độ cân đối</label>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { label: 'Đối xứng khuôn mặt', value: 'facial' },
                                { label: 'Cân đối cơ thể & Dáng', value: 'body' },
                                { label: 'Toàn diện (Tỷ lệ vàng)', value: 'full' }
                            ].map((opt) => (
                                <button 
                                  key={opt.value} 
                                  onClick={() => onSettingsChange({ balanceMode: opt.value as any })} 
                                  className={`px-5 py-4 rounded-2xl border-2 font-black text-[10px] transition-all text-left uppercase flex items-center justify-between group ${settings.balanceMode === opt.value ? 'bg-violet-500/10 border-violet-500 text-white shadow-lg shadow-violet-900/20' : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/10'}`}
                                >
                                  {opt.label}
                                  {settings.balanceMode === opt.value && <CheckIcon className="w-4 h-4 text-violet-400" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <label className="text-[10px] font-black text-gray-500 uppercase block mb-4 tracking-widest">Ghi chú cân chỉnh</label>
                      <textarea 
                        value={settings.userPrompt} 
                        onChange={e => onSettingsChange({ userPrompt: e.target.value })} 
                        placeholder="VD: Cân bằng lại bả vai, thu gọn tỉ lệ mặt..." 
                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[11px] text-gray-200 h-28 focus:border-violet-500/50 outline-none transition-all resize-none placeholder:text-gray-700" 
                      />
                    </div>
                </div>
            </div>

            <button 
              onClick={onRefineRestoration} 
              disabled={isProcessing} 
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-4.5 rounded-2xl transition-all uppercase text-xs tracking-[0.2em] shadow-2xl shadow-violet-900/30 flex items-center justify-center gap-3 active:scale-95 group"
            >
              <ScaleIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" /> THIẾT LẬP CÂN ĐỐI AI
            </button>
        </div>
    );
  };

  const renderBackgroundSwapSettings = () => {
    return (
        <div className="space-y-6">
            <div 
              className="bg-[#151515] border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer group hover:bg-[#1a1a1a] transition-all" 
              onClick={() => onSettingsChange({ enableUpscale: !settings.enableUpscale })}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${settings.enableUpscale ? 'bg-teal-500/10' : 'bg-zinc-800'}`}>
                  <SparklesIcon className={`w-5 h-5 ${settings.enableUpscale ? 'text-teal-400' : 'text-zinc-600'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-gray-300 uppercase tracking-tight">Tăng chất lượng (Upscale)</span>
                  <span className="text-[9px] text-teal-500/80 font-bold uppercase tracking-tighter leading-tight">High Fidelity Engine</span>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full p-1 transition-all duration-300 relative ${settings.enableUpscale ? 'bg-teal-600' : 'bg-zinc-700'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-all duration-300 ${settings.enableUpscale ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            <div className="bg-[#151515] border border-white/5 rounded-3xl p-6 shadow-xl">
                <h3 className="text-xs font-black text-teal-400 uppercase text-center mb-8 tracking-[0.2em] border-b border-white/5 pb-4">Thay nền AI</h3>
                
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ảnh nền tham chiếu (Tùy chọn)</label>
                          {settings.referenceImagePreview && (
                              <button 
                                  onClick={() => onSettingsChange({ referenceImage: null, referenceImagePreview: null })}
                                  className="text-[9px] font-black text-red-500 uppercase border border-red-500/30 px-3 py-1 rounded-lg hover:bg-red-500/10 transition-all"
                              >
                                  Xóa ảnh
                              </button>
                          )}
                        </div>
                        
                        <label className={`relative block border-2 border-dashed rounded-[2rem] h-44 overflow-hidden cursor-pointer hover:bg-black/40 transition-all group/upload ${settings.referenceImagePreview ? 'border-teal-500 shadow-[0_0_30px_rgba(20,184,166,0.15)]' : 'border-white/5'}`}>
                            {settings.referenceImagePreview ? (
                                <img src={settings.referenceImagePreview} className="w-full h-full object-contain p-2" alt="Reference Background" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 group-hover/upload:scale-110 transition-transform">
                                    <div className="p-3 bg-teal-500/5 rounded-2xl mb-3">
                                      <PhotoIcon className="w-10 h-10 text-teal-500/40" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Chọn ảnh nền mẫu</span>
                                </div>
                            )}
                            <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        onSettingsChange({
                                            referenceImage: file,
                                            referenceImagePreview: URL.createObjectURL(file)
                                        });
                                    }
                                }} 
                                accept="image/*"
                            />
                        </label>
                        <p className="text-[9px] text-gray-600 italic mt-3 text-center font-medium">*Tải ảnh bối cảnh bạn muốn AI ghép vào</p>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <label className="text-[10px] font-black text-gray-500 uppercase block mb-4 tracking-widest">Mô tả bối cảnh (Prompt)</label>
                        <textarea 
                            value={settings.userPrompt} 
                            onChange={e => onSettingsChange({ userPrompt: e.target.value })} 
                            placeholder="VD: Bãi biển hoàng hôn, văn phòng hiện đại, rừng thông sương mù..." 
                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-[11px] text-gray-200 h-36 focus:border-teal-500/50 outline-none transition-all resize-none placeholder:text-gray-700" 
                        />
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <button 
                            onClick={onOpenDrawing}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 py-3 rounded-xl border border-white/5 flex items-center justify-center gap-3 transition-all group"
                        >
                            <PencilIcon className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] font-black uppercase tracking-widest">Vẽ vùng cần xóa</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">Tô màu vào vật thể muốn loại bỏ</span>
                            </div>
                        </button>
                    </div>
                </div>
                <div 
                    className="mt-6 bg-[#151515] border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer group hover:bg-[#1a1a1a] transition-all" 
                    onClick={() => onSettingsChange({ preserveFace: !settings.preserveFace })}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${settings.preserveFace ? 'bg-orange-500/10' : 'bg-zinc-800'}`}>
                            <IdentificationIcon className={`w-5 h-5 ${settings.preserveFace ? 'text-orange-400' : 'text-zinc-600'}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-gray-300 uppercase tracking-tight">Bảo toàn nét mặt</span>
                            <span className="text-[9px] text-orange-500/80 font-bold uppercase tracking-tighter leading-tight">Identity Lock AI</span>
                        </div>
                    </div>
                    <div className={`w-11 h-6 rounded-full p-1 transition-all duration-300 relative ${settings.preserveFace ? 'bg-orange-600' : 'bg-zinc-700'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-all duration-300 ${settings.preserveFace ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                </div>
            </div>

            <button 
                onClick={onRefineRestoration} 
                disabled={isProcessing} 
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-black py-4.5 rounded-2xl transition-all uppercase text-xs tracking-[0.2em] shadow-2xl shadow-teal-900/30 flex items-center justify-center gap-3 active:scale-95 group"
            >
                <SparklesIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" /> THỰC HIỆN THAY NỀN AI
            </button>
        </div>
    );
  };

  const renderRestorationSamples = () => (
      <div className="bg-[#151515] border border-white/5 rounded-3xl shadow-xl overflow-hidden mb-4">
          <button 
            onClick={() => setIsRestoSamplesOpen(!isRestoSamplesOpen)} 
            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all"
          >
            <h3 className="font-black text-blue-400 text-[11px] flex items-center gap-3 uppercase tracking-[0.15em]">
              <ClipboardDocumentListIcon className="w-5 h-5" /> Mẫu Prompt có sẵn
            </h3>
            <ChevronDownIcon className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${isRestoSamplesOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isRestoSamplesOpen && (
              <div className="p-5 pt-0 border-t border-white/5 space-y-4 animate-fade-in">
                  <div className="space-y-3">
                      <button 
                        onClick={() => onSettingsChange({ userPrompt: PRESERVE_ORIGINAL_PROMPT })} 
                        className={`w-full bg-blue-500/5 hover:bg-blue-500/10 border p-4 rounded-2xl text-left transition-all flex items-center gap-4 group ${settings.userPrompt === PRESERVE_ORIGINAL_PROMPT ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-900/20' : 'border-blue-500/20'}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 group-hover:scale-110 transition-transform flex-shrink-0 flex items-center justify-center shadow-lg shadow-blue-900/20">
                          <FingerPrintIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-[11px] font-black text-white uppercase flex items-center justify-between tracking-tight">
                            Bảo Toàn Nét Gốc 
                            <span className="bg-blue-600 text-[8px] px-1.5 py-0.5 rounded font-black">PREMIUM</span>
                          </div>
                          <div className="text-[9px] text-blue-300/60 font-medium italic mt-0.5">Giữ khuôn mặt & cấu trúc gốc 100%</div>
                        </div>
                      </button>

                      <button 
                        onClick={() => onSettingsChange({ userPrompt: CUSTOM_ULTRA_RESTO_PROMPT })} 
                        className={`w-full bg-emerald-500/5 hover:bg-emerald-500/10 border p-4 rounded-2xl text-left transition-all flex items-center gap-4 group ${settings.userPrompt === CUSTOM_ULTRA_RESTO_PROMPT ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-900/20' : 'border-emerald-500/20'}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 group-hover:scale-110 transition-transform flex-shrink-0 flex items-center justify-center shadow-lg shadow-emerald-900/20">
                          <WrenchScrewdriverIcon className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-[11px] font-black text-white uppercase flex items-center justify-between tracking-tight">
                            Yêu Cầu Tùy Chỉnh
                            <span className="bg-emerald-600 text-[8px] px-1.5 py-0.5 rounded font-black">VIP</span>
                          </div>
                          <div className="text-[9px] text-emerald-300/60 font-medium italic mt-0.5">Phục chế siêu thực & Identity Lock Max</div>
                        </div>
                      </button>

                      <div className="grid grid-cols-1 gap-2">
                        {[ 
                          { label: 'Phục chế siêu chất lượng', prompt: SUPER_QUALITY_PROMPT, icon: SparklesIcon, color: 'text-amber-400' }, 
                          { label: 'Phục hồi bằng khen', prompt: CERTIFICATE_RESTORATION_PROMPT, icon: AcademicCapIcon, color: 'text-emerald-400' }, 
                          { label: 'Xoay góc mặt về phía trước', prompt: FACE_FRONT_ROTATION_PROMPT, icon: FaceSmileIcon, color: 'text-pink-400' }, 
                          { label: 'Ảnh chân dung nghệ thuật', prompt: PORTRAIT_PROMPT, icon: IdentificationIcon, color: 'text-violet-400' }
                        ].map((item, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => onSettingsChange({ userPrompt: item.prompt })} 
                            className={`w-full bg-black/40 hover:bg-white/5 border p-3.5 rounded-2xl text-left transition-all flex items-center gap-4 group ${settings.userPrompt === item.prompt ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-900/10' : 'border-white/5'}`}
                          >
                            <div className={`p-2 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors ${settings.userPrompt === item.prompt ? 'bg-emerald-500/20' : ''}`}>
                              <item.icon className={`w-5 h-5 ${settings.userPrompt === item.prompt ? 'text-emerald-400' : item.color}`} />
                            </div>
                            <div className={`text-[10px] font-black uppercase tracking-tight transition-colors ${settings.userPrompt === item.prompt ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{item.label}</div>
                          </button>
                        ))}
                      </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-[0.2em]">Yêu cầu tuỳ chỉnh</h3>
                    </div>
                    <textarea 
                      value={settings.userPrompt} 
                      onChange={e => onSettingsChange({ userPrompt: e.target.value })} 
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[11px] text-gray-200 h-44 focus:border-emerald-500/50 outline-none resize-none transition-all placeholder:text-gray-700"
                      placeholder="Mô tả chi tiết yêu cầu phục chế của bạn..."
                    />
                  </div>
              </div>
          )}
      </div>
  );

  const renderRestorationExtra = () => (
      <div className="bg-[#151515] border border-white/5 rounded-3xl shadow-xl overflow-hidden mb-4">
          <button 
            onClick={() => setIsRestoExtraOpen(!isRestoExtraOpen)} 
            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all"
          >
            <h3 className="font-black text-emerald-400 text-[11px] flex items-center gap-3 uppercase tracking-[0.15em]">
              <AdjustmentsHorizontalIcon className="w-5 h-5" /> Tùy chỉnh nâng cao
            </h3>
            <ChevronDownIcon className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${isRestoExtraOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isRestoExtraOpen && (
              <div className="p-5 pt-0 border-t border-white/5 space-y-6 animate-fade-in">
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Yêu cầu nâng cao (Prompt)</span>
                      <button 
                        onClick={() => onSettingsChange({ restorationCustomPrompt: MUSEUM_GRADE_RESTORATION_PROMPT })} 
                        className="flex items-center gap-2 border border-emerald-500/50 rounded-xl bg-emerald-500/5 px-4 py-1.5 hover:bg-emerald-500/10 group transition-all"
                      >
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">Nạp mẫu VIP</span>
                        <SparklesIcon className="w-3 h-3 text-emerald-400 group-hover:rotate-12 transition-transform" />
                      </button>
                    </div>
                    <textarea 
                      value={settings.restorationCustomPrompt} 
                      onChange={e => onSettingsChange({ restorationCustomPrompt: e.target.value })} 
                      className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-[11px] text-gray-300 font-mono h-32 outline-none focus:border-emerald-500/30 transition-all resize-none placeholder:text-gray-700" 
                      placeholder="Nhập yêu cầu chi tiết cho AI..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      {QUICK_RESTORATION_TEMPLATES.map((tmpl) => (
                        <button 
                          key={tmpl.id} 
                          onClick={() => onSettingsChange({ restorationCustomPrompt: tmpl.prompt })} 
                          className={`bg-black/40 hover:bg-white/5 border-2 p-4 rounded-2xl text-left flex flex-col items-center justify-center gap-3 transition-all group ${settings.restorationCustomPrompt === tmpl.prompt ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-900/10' : 'border-white/5 hover:border-white/10'}`}
                        >
                          <div className={`p-2.5 rounded-xl transition-colors ${settings.restorationCustomPrompt === tmpl.prompt ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                            <tmpl.icon className={`w-6 h-6 transition-colors ${settings.restorationCustomPrompt === tmpl.prompt ? 'text-emerald-400' : 'text-emerald-500/40 group-hover:text-emerald-400'}`} />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-tight text-center leading-tight transition-colors ${settings.restorationCustomPrompt === tmpl.prompt ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                            {tmpl.label}
                          </span>
                        </button>
                      ))}
                  </div>

                  <button 
                    onClick={onRefineRestoration} 
                    disabled={isProcessing} 
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all uppercase text-xs tracking-[0.2em] shadow-2xl shadow-emerald-900/30 flex items-center justify-center gap-3 active:scale-95 group"
                  >
                    <SparklesIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" /> THỰC THI PHỤC CHẾ VIP
                  </button>
              </div>
          )}
      </div>
  );

  const renderConceptSettings = () => {
    return (
        <div className="space-y-4">
            {/* Tăng chất lượng Toggle */}
            <div 
              className="bg-[#151515] border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer group hover:bg-[#1a1a1a] transition-all" 
              onClick={() => onSettingsChange({ enableUpscale: !settings.enableUpscale })}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${settings.enableUpscale ? 'bg-sky-500/10' : 'bg-zinc-800'}`}>
                  <BoltIcon className={`w-5 h-5 ${settings.enableUpscale ? 'text-sky-400' : 'text-zinc-600'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-gray-300 uppercase tracking-tight">Tăng chất lượng</span>
                  <span className="text-[9px] text-orange-500 font-bold uppercase tracking-tighter leading-tight">*Công nghệ Codeformer</span>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full p-1 transition-all duration-300 relative ${settings.enableUpscale ? 'bg-sky-600' : 'bg-zinc-700'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-all duration-300 ${settings.enableUpscale ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            {/* Ảnh tham chiếu (Style) */}
            <div className="bg-[#151515] border border-white/5 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setIsConceptStyleOpen(!isConceptStyleOpen)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                    <span className="text-xs font-black text-gray-300 uppercase tracking-widest">Ảnh tham chiếu (Style)</span>
                    {isConceptStyleOpen ? <ChevronUpIcon className="w-4 h-4 text-gray-500" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500" />}
                </button>
                {isConceptStyleOpen && (
                    <div className="p-6 pt-0 space-y-4">
                        <label className={`relative block border-2 border-dashed rounded-2xl h-40 overflow-hidden cursor-pointer hover:bg-black/40 transition-all group/upload ${settings.referenceImagePreview ? 'border-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.15)]' : 'border-white/5'}`}>
                            {settings.referenceImagePreview ? (
                                <img src={settings.referenceImagePreview} className="w-full h-full object-contain p-2" alt="Style Reference" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 group-hover/upload:scale-110 transition-transform">
                                    <PhotoIcon className="w-10 h-10 text-sky-500/40 mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Tải lên Style Reference</span>
                                </div>
                            )}
                            <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        onSettingsChange({
                                            referenceImage: file,
                                            referenceImagePreview: URL.createObjectURL(file)
                                        });
                                    }
                                }} 
                                accept="image/*"
                            />
                        </label>
                        {settings.referenceImagePreview && (
                            <button 
                                onClick={() => onSettingsChange({ referenceImage: null, referenceImagePreview: null })}
                                className="w-full py-2 text-[9px] font-black text-red-500 uppercase border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all"
                            >
                                Xóa ảnh tham chiếu
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Mẫu Prompt Sẵn Có */}
            <div className="bg-[#151515] border border-white/5 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setIsConceptSamplesOpen(!isConceptSamplesOpen)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <ClipboardDocumentListIcon className="w-4 h-4 text-sky-400" />
                        <span className="text-xs font-black text-sky-400 uppercase tracking-widest">Mẫu Prompt Sẵn Có</span>
                    </div>
                    {isConceptSamplesOpen ? <ChevronUpIcon className="w-4 h-4 text-gray-500" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500" />}
                </button>
                {isConceptSamplesOpen && (
                    <div className="p-4 pt-0 grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                        {CONCEPT_SAMPLES.map((sample, idx) => (
                            <button 
                                key={idx}
                                onClick={() => onSettingsChange({ userPrompt: sample.prompt })}
                                className="px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-[9px] font-black text-gray-400 uppercase hover:border-sky-500/50 hover:text-white transition-all text-left truncate"
                            >
                                {sample.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Mô tả Concept */}
            <div className="bg-[#151515] border border-white/5 rounded-3xl p-6 shadow-xl">
                <h3 className="text-xs font-black text-amber-500 uppercase text-center mb-6 tracking-[0.2em]">Mô tả Concept</h3>
                <div className="relative">
                    <textarea 
                        value={settings.userPrompt} 
                        onChange={e => onSettingsChange({ userPrompt: e.target.value })} 
                        placeholder="Mô tả chi tiết bối cảnh..." 
                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[11px] text-gray-200 h-40 focus:border-amber-500/50 outline-none transition-all resize-none placeholder:text-gray-700" 
                    />
                    <div className="absolute top-4 right-4">
                        <MicrophoneIcon className="w-5 h-5 text-gray-600 hover:text-amber-500 cursor-pointer transition-colors" />
                    </div>
                </div>
            </div>

            {/* Tùy chọn ảnh gốc */}
            <div className="bg-[#151515] border border-white/5 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setIsConceptOriginalOpen(!isConceptOriginalOpen)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                    <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Tùy chọn ảnh gốc</span>
                    {isConceptOriginalOpen ? <ChevronUpIcon className="w-4 h-4 text-gray-500" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500" />}
                </button>
                {isConceptOriginalOpen && (
                    <div className="p-4 pt-0 space-y-2">
                        {[
                            { key: 'preservePose', label: 'Giữ nguyên dáng người' },
                            { key: 'preserveComposition', label: 'Giữ nguyên bố cục' },
                            { key: 'preserveFocalLength', label: 'Giữ tiêu cự ống kính' },
                            { key: 'preserveAspectRatio', label: 'Giữ tỷ lệ khung hình' },
                            { key: 'disableForeground', label: 'Loại bỏ tiền cảnh' },
                            { key: 'preserveSubjectPosition', label: 'Giữ vị trí chủ thể' },
                            { key: 'keepOriginalOutfit', label: 'Giữ trang phục gốc' },
                            { key: 'subjectMatchSceneColor', label: 'Chủ thể khớp màu nền' },
                            { key: 'sceneMatchSubjectColor', label: 'Nền khớp màu chủ thể' }
                        ].map((opt) => (
                            <div 
                                key={opt.key}
                                className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 cursor-pointer hover:bg-white/5 transition-all"
                                onClick={() => handleOptionToggle(opt.key as keyof GenerationSettings)}
                            >
                                <span className="text-[10px] font-black text-gray-400 uppercase">{opt.label}</span>
                                <div className={`w-8 h-4 rounded-full p-0.5 transition-all ${settings[opt.key as keyof GenerationSettings] ? 'bg-emerald-600' : 'bg-zinc-700'}`}>
                                    <div className={`bg-white w-3 h-3 rounded-full transition-all ${settings[opt.key as keyof GenerationSettings] ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Hiệu ứng hình ảnh */}
            <div className="bg-[#151515] border border-white/5 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setIsConceptEffectsOpen(!isConceptEffectsOpen)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                    <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Hiệu ứng hình ảnh</span>
                    {isConceptEffectsOpen ? <ChevronUpIcon className="w-4 h-4 text-gray-500" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500" />}
                </button>
                {isConceptEffectsOpen && (
                    <div className="p-4 pt-0 space-y-4">
                        <div>
                            <label className="text-[9px] font-black text-gray-500 uppercase block mb-2">Thời tiết</label>
                            <select 
                                value={settings.weather} 
                                onChange={e => onSettingsChange({ weather: e.target.value as WeatherOption })}
                                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] text-gray-300 outline-none focus:border-blue-500/50"
                            >
                                {Object.values(WeatherOption).map(w => <option key={w} value={w}>{w}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-500 uppercase block mb-2">Độ mờ hậu cảnh (Blur)</label>
                            <input 
                                type="range" min="0" max="10" step="0.5" 
                                value={settings.blurAmount} 
                                onChange={e => onSettingsChange({ blurAmount: parseFloat(e.target.value) })}
                                className="w-full accent-blue-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Hiệu ứng ánh sáng */}
            <div className="bg-[#151515] border border-white/5 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setIsConceptLightingOpen(!isConceptLightingOpen)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                    <span className="text-xs font-black text-orange-400 uppercase tracking-widest">Hiệu ứng ánh sáng</span>
                    {isConceptLightingOpen ? <ChevronUpIcon className="w-4 h-4 text-gray-500" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500" />}
                </button>
                {isConceptLightingOpen && (
                    <div className="p-4 pt-0 grid grid-cols-1 gap-2">
                        {LIGHT_THEMES.map((theme) => (
                            <button 
                                key={theme.id}
                                onClick={() => {
                                    const current = settings.lightingEffects || [];
                                    const next = current.includes(theme.label) ? current.filter(l => l !== theme.label) : [...current, theme.label];
                                    onSettingsChange({ lightingEffects: next });
                                }}
                                className={`px-4 py-3 rounded-xl border font-black text-[9px] transition-all text-left uppercase flex items-center justify-between ${settings.lightingEffects?.includes(theme.label) ? 'bg-orange-500/10 border-orange-500 text-white' : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/10'}`}
                            >
                                {theme.label}
                                {settings.lightingEffects?.includes(theme.label) && <CheckIcon className="w-3 h-3 text-orange-400" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button 
                onClick={onRefineRestoration} 
                disabled={isProcessing} 
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black py-4.5 rounded-2xl transition-all uppercase text-xs tracking-[0.2em] shadow-2xl shadow-orange-900/30 flex items-center justify-center gap-3 active:scale-95"
            >
                {isProcessing ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <SparklesIcon className="w-6 h-6" />}
                BẮT ĐẦU TẠO CONCEPT AI
            </button>
        </div>
    );
  };

  const renderPaintingSettings = () => {
    return (
        <div className="space-y-6">
            <div 
              className="bg-[#151515] border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer group hover:bg-[#1a1a1a] transition-all" 
              onClick={() => onSettingsChange({ paintingQualityEnhance: !settings.paintingQualityEnhance })}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${settings.paintingQualityEnhance ? 'bg-violet-500/10' : 'bg-zinc-800'}`}>
                  <SparklesIcon className={`w-5 h-5 ${settings.paintingQualityEnhance ? 'text-violet-400' : 'text-zinc-600'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-gray-300 uppercase tracking-tight">Tăng chất lượng tranh</span>
                  <span className="text-[9px] text-violet-500/80 font-bold uppercase tracking-tighter leading-tight">Artistic HD Engine</span>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full p-1 transition-all duration-300 relative ${settings.paintingQualityEnhance ? 'bg-violet-600' : 'bg-zinc-700'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-all duration-300 ${settings.paintingQualityEnhance ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            <div className="bg-[#151515] border border-white/5 rounded-3xl p-6 shadow-xl">
                <h3 className="text-xs font-black text-violet-400 uppercase text-center mb-8 tracking-[0.2em] border-b border-white/5 pb-4">Phong cách nghệ thuật</h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase block mb-4 tracking-widest">Chọn phong cách vẽ</label>
                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {PAINTING_STYLES.map((style) => (
                                <button 
                                  key={style.value} 
                                  onClick={() => onSettingsChange({ paintingStyle: style.value, userPrompt: style.prompt })} 
                                  className={`px-4 py-3.5 rounded-2xl border-2 font-black text-[10px] transition-all text-left uppercase flex items-center justify-between group ${settings.paintingStyle === style.value ? 'bg-violet-500/10 border-violet-500 text-white shadow-lg shadow-violet-900/20' : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/10'}`}
                                >
                                  {style.label}
                                  {settings.paintingStyle === style.value && <CheckIcon className="w-4 h-4 text-violet-400" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Mẫu tranh tham chiếu (Tùy chọn)</label>
                          {settings.referenceImagePreview && (
                              <button 
                                  onClick={() => onSettingsChange({ referenceImage: null, referenceImagePreview: null })}
                                  className="text-[9px] font-black text-red-500 uppercase border border-red-500/30 px-3 py-1 rounded-lg hover:bg-red-500/10 transition-all"
                              >
                                  Xóa
                              </button>
                          )}
                        </div>
                        
                        <label className={`relative block border-2 border-dashed rounded-2xl h-32 overflow-hidden cursor-pointer hover:bg-black/40 transition-all group/upload ${settings.referenceImagePreview ? 'border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.15)]' : 'border-white/5'}`}>
                            {settings.referenceImagePreview ? (
                                <img src={settings.referenceImagePreview} className="w-full h-full object-contain p-2" alt="Style Reference" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 group-hover/upload:scale-110 transition-transform">
                                    <SwatchIcon className="w-8 h-8 text-violet-500/40 mb-2" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Tải mẫu phong cách</span>
                                </div>
                            )}
                            <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        onSettingsChange({
                                            referenceImage: file,
                                            referenceImagePreview: URL.createObjectURL(file)
                                        });
                                    }
                                }} 
                                accept="image/*"
                            />
                        </label>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <label className="text-[10px] font-black text-gray-500 uppercase block mb-4 tracking-widest">Mô tả phong cách vẽ</label>
                        <textarea 
                            value={settings.userPrompt} 
                            onChange={e => onSettingsChange({ userPrompt: e.target.value })} 
                            placeholder="VD: Vẽ theo phong cách Van Gogh, nét cọ dày, màu sắc rực rỡ..." 
                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[11px] text-gray-200 h-32 focus:border-violet-500/50 outline-none transition-all resize-none placeholder:text-gray-700" 
                        />
                    </div>
                </div>
            </div>

            <button 
                onClick={onRefineRestoration} 
                disabled={isProcessing} 
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-4.5 rounded-2xl transition-all uppercase text-xs tracking-[0.2em] shadow-2xl shadow-violet-900/30 flex items-center justify-center gap-3 active:scale-95 group"
            >
                <SwatchIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" /> BẮT ĐẦU VẼ NGHỆ THUẬT AI
            </button>
        </div>
    );
  };

  const renderGallerySection = () => (
      <div className="border border-white/5 rounded-[2rem] bg-[#151515] flex-1 min-h-[350px] flex flex-col shadow-2xl overflow-hidden">
          <button 
            onClick={() => setIsGalleryOpen(!isGalleryOpen)} 
            className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-purple-500/10 rounded-xl group-hover:scale-110 transition-transform">
                <ArchiveBoxIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-left">
                <h3 className="font-black text-white text-xs uppercase tracking-[0.1em]">Kho ảnh hệ thống</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Lưu trữ: {galleryItems.length} tác phẩm</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform duration-500 ${isGalleryOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {isGalleryOpen && (
              <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="p-4 border-t border-white/5 bg-black/20 flex flex-wrap gap-2">
                    <span className="text-[9px] font-black text-purple-400/60 uppercase tracking-widest px-3 py-1 rounded-full bg-purple-500/5 border border-purple-500/10">Gần đây</span>
                  </div>
                  
                  <div className="p-4 overflow-y-auto grid grid-cols-2 gap-4 flex-1 custom-scrollbar">
                      {galleryItems.map((item) => (
                          <div key={item.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-white/5 hover:border-purple-500/50 transition-all shadow-xl bg-black/40">
                            <img 
                              src={item.url} 
                              className="w-full h-full object-cover cursor-zoom-in group-hover:scale-110 transition-transform duration-700" 
                              onClick={() => onSelectFromGallery(item)} 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                              <div className="flex justify-end">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onDeleteFromGallery?.(item.id); }} 
                                  className="p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-xl shadow-lg backdrop-blur-md transition-all hover:scale-110" 
                                  title="Xóa khỏi kho"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex flex-col gap-2">
                                <a 
                                  href={item.url} 
                                  download={`gallery_nhc_${item.id}.png`} 
                                  onClick={(e) => e.stopPropagation()} 
                                  className="w-full bg-sky-600/90 hover:bg-sky-600 text-white py-2 rounded-xl text-[9px] font-black uppercase text-center flex items-center justify-center gap-1.5 backdrop-blur-md transition-all"
                                >
                                  <CloudArrowDownIcon className="w-4 h-4" /> Tải về
                                </a>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onSelectFromGallery(item); }} 
                                  className="w-full bg-white/90 hover:bg-white text-black py-2 rounded-xl text-[9px] font-black uppercase text-center flex items-center justify-center gap-1.5 backdrop-blur-md transition-all"
                                >
                                  <ArrowTopRightOnSquareIcon className="w-4 h-4" /> Sử dụng
                                </button>
                              </div>
                            </div>
                          </div>
                      ))}
                      
                      {galleryItems.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 px-4">
                          <div className="w-20 h-20 bg-zinc-900/50 rounded-[2rem] flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                            <ArchiveBoxIcon className="w-10 h-10 text-zinc-700" />
                          </div>
                          <div className="text-center">
                            <p className="text-[11px] text-gray-500 font-black uppercase tracking-widest mb-2">Kho ảnh trống</p>
                            <p className="text-[10px] text-gray-700 font-medium max-w-[150px] mx-auto leading-relaxed">Các tác phẩm bạn tạo sẽ xuất hiện tại đây</p>
                          </div>
                        </div>
                      )}
                  </div>
                  
                  {galleryItems.length > 0 && (
                    <div className="p-4 border-t border-white/5 bg-black/40">
                      <p className="text-[9px] text-gray-600 font-bold uppercase text-center italic tracking-tight">
                        *Ảnh trong kho sẽ tự động dọn dẹp sau 3 ngày
                      </p>
                    </div>
                  )}
              </div>
          )}
      </div>
  );

  if (viewMode === 'home') return null;

  return (
    <div className="h-full bg-[#0d0d0d] border-l border-white/5 p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar relative">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 via-transparent to-transparent pointer-events-none"></div>

        <div className="relative flex flex-col items-center gap-2 py-4 border-b border-white/5">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-sky-500/10 border border-sky-500/20 rounded-full">
              <span className="text-[8px] font-black text-sky-400 uppercase tracking-[0.2em]">System Panel</span>
            </div>
            <h2 className={`text-xl font-black uppercase tracking-tighter text-center leading-tight ${viewMode === 'profile' ? 'text-[#ec4899]' : viewMode === 'restoration' ? 'text-emerald-500' : viewMode === 'face-straighten' ? 'text-yellow-500' : viewMode === 'lifestyle' ? 'text-emerald-500' : viewMode === 'mockup' ? 'text-amber-500' : viewMode === 'lighting-effects' ? 'text-orange-500' : viewMode === 'remove-background' ? 'text-indigo-400' : viewMode === 'symmetric-edit' ? 'text-violet-400' : viewMode === 'baby-ultrasound' ? 'text-pink-400' : viewMode === 'architecture-render' ? 'text-cyan-400' : viewMode === 'upscale-expand' ? 'text-blue-500' : viewMode === 'painting' ? 'text-violet-500' : viewMode === 'concept' ? 'text-amber-500' : 'text-sky-500'}`}>
              {viewMode === 'profile' ? 'Ảnh hồ sơ NHC' : viewMode === 'restoration' ? 'Phục chế ảnh cũ' : viewMode === 'face-straighten' ? 'CĂN CHỈNH THẲNG MẶT AI' : viewMode === 'lifestyle' ? 'TẠO ẢNH SỐNG ẢO AI' : viewMode === 'mockup' ? 'MOCKUP THIẾT KẾ BÁN HÀNG' : viewMode === 'lighting-effects' ? 'HIỆU ỨNG ÁNH SÁNG AI' : viewMode === 'remove-background' ? 'Xóa nền AI' : viewMode === 'symmetric-edit' ? 'CHỈNH SỬA CÂN ĐỐI AI' : viewMode === 'baby-ultrasound' ? 'DỰ ĐOÁN EM BÉ AI' : viewMode === 'architecture-render' ? 'Kiến trúc 3D' : viewMode === 'upscale-expand' ? 'Làm nét & Mở rộng' : viewMode === 'painting' ? 'TRANH VẼ NGHỆ THUẬT AI' : viewMode === 'concept' ? 'FAKE CONCEPT AI' : 'Thay nền AI'}
            </h2>
            <div className="w-12 h-1 bg-current opacity-20 rounded-full"></div>
        </div>

        <div className="flex-1 flex flex-col gap-6 relative">
          {renderModelSelection()}
          
          <div className="space-y-6">
            {viewMode === 'profile' ? renderProfileSettings() : 
             viewMode === 'face-straighten' ? renderFaceStraightenSettings() : 
             viewMode === 'lifestyle' ? renderLifestyleSettings() : 
             viewMode === 'mockup' ? renderMockupSettings() : 
             viewMode === 'lighting-effects' ? renderLightingEffectSettings() : 
             viewMode === 'remove-background' ? renderRemoveBackgroundSettings() : 
             viewMode === 'symmetric-edit' ? renderSymmetricEditSettings() : 
             viewMode === 'baby-ultrasound' ? renderBabyUltrasoundSettings() : 
             viewMode === 'architecture-render' ? renderArchitectureRenderSettings() : 
             viewMode === 'background-swap' ? renderBackgroundSwapSettings() : 
             viewMode === 'upscale-expand' ? renderUpscaleExpandSettings() : 
             viewMode === 'painting' ? renderPaintingSettings() : 
             viewMode === 'concept' ? renderConceptSettings() : 
             viewMode === 'restoration' && (
                <div className="flex flex-col gap-4">
                    <button 
                      onClick={onAnalyzeRestoration} 
                      disabled={isAnalyzingRestoration || isProcessing} 
                      className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 py-3.5 rounded-2xl text-[11px] font-black uppercase flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 group"
                    >
                      {isAnalyzingRestoration ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <MagnifyingGlassCircleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                      {isAnalyzingRestoration ? "Đang phân tích..." : "Phân tích ảnh chuyên sâu"}
                    </button>
                    
                    {renderRestorationSamples()}
                    
                    {renderRestorationCheckboxes()}
                    
                    <div 
                      className="bg-[#151515] border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer group hover:bg-[#1a1a1a] transition-all" 
                      onClick={() => handleOptionToggle('enableUpscale')}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${settings.enableUpscale ? 'bg-emerald-500/10' : 'bg-zinc-800'}`}>
                          <SparklesIcon className={`w-5 h-5 ${settings.enableUpscale ? 'text-emerald-400' : 'text-zinc-600'}`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-gray-300 uppercase tracking-tight">Tăng chất lượng</span>
                          <span className="text-[9px] text-orange-500/80 font-bold uppercase tracking-tighter leading-tight">CodeFormer AI</span>
                        </div>
                      </div>
                      <div className={`w-11 h-6 rounded-full p-1 transition-all duration-300 relative ${settings.enableUpscale ? 'bg-emerald-600' : 'bg-zinc-700'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-all duration-300 ${settings.enableUpscale ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </div>

                    <div 
                      className="bg-[#151515] border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer group hover:bg-[#1a1a1a] transition-all" 
                      onClick={() => handleOptionToggle('restoEnableAdvanced')}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${settings.restoEnableAdvanced ? 'bg-emerald-500/10' : 'bg-zinc-800'}`}>
                          <AdjustmentsHorizontalIcon className={`w-5 h-5 ${settings.restoEnableAdvanced ? 'text-emerald-400' : 'text-zinc-600'}`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-gray-300 uppercase tracking-tight">Tùy chỉnh nâng cao</span>
                          <span className="text-[9px] text-emerald-500/80 font-bold uppercase tracking-tighter leading-tight">Advanced Mode</span>
                        </div>
                      </div>
                      <div className={`w-11 h-6 rounded-full p-1 transition-all duration-300 relative ${settings.restoEnableAdvanced ? 'bg-emerald-600' : 'bg-zinc-700'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-all duration-300 ${settings.restoEnableAdvanced ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </div>

                    {settings.restoEnableAdvanced && renderRestorationExtra()}
                </div>
            )}
          </div>

          {viewMode !== 'home' && renderGallerySection()}
        </div>

        <div className="mt-auto pt-6 border-t border-white/5 flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
            <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em]">© NGUYỄN HỮU CHÍNH</div>
            <div className="text-[9px] text-gray-500 font-medium tracking-widest">TOOL MAGIC NHC VIP PRO v3.5.5</div>
        </div>
    </div>
  );
};

export default ControlPanel;
