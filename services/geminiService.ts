
import { GoogleGenAI, Modality, Part } from "@google/genai";
import { GenerationSettings, WeatherOption, ProfileSettings } from "../types";

// --- IMAGE HELPERS ---

const resizeImage = (file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(img.height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        let mimeType = file.type;
        if (mimeType !== 'image/png' && mimeType !== 'image/webp') {
            mimeType = 'image/jpeg';
        }

        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

const getProAutoRatio = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
        if (img.height > img.width) resolve("2:3");
        else if (img.width > img.height) resolve("3:2");
        else resolve("1:1");
        URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve("1:1");
    img.src = URL.createObjectURL(file);
  });
};

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
    });
};

export const fileToPart = async (file: File): Promise<Part> => {
    const base64Data = await fileToBase64(file);
    return {
        inlineData: {
            data: base64Data,
            mimeType: file.type,
        },
    };
};

// --- CORE GENERATION ---

const CODEFORMER_EMULATION_PROMPT = {
    "algorithm_emulation": "CodeFormer",
    "fidelity_weight": 0.7,
    "output_requirement": "Remove scratches, artifacts, and blur, high-end face reconstruction."
};


const getAI = (modelType?: string, customApiKey?: string) => {
    const apiKey = customApiKey || ((modelType === 'pro-image' || modelType === 'nano') ? process.env.API_KEY : process.env.GEMINI_API_KEY);
    return new GoogleGenAI({ apiKey });
};

export const generateFaceStraightenImage = async (
    originalFile: File,
    settings: GenerationSettings
): Promise<string> => {
    try {
        const ai = getAI(settings.modelType, settings.customApiKey);
        let originalBase64 = await resizeImage(originalFile);
        const { straightenIntensity = 1.0, userPrompt } = settings;

        const straightenPrompt = `
        TASK: FACE RE-ORIENTATION & SYMMETRY ALIGNMENT.
        INSTRUCTION: 
        1. Analyze the facial roll, pitch, and yaw of the subject.
        2. Rotate and align the face axis to be perfectly vertical and centered.
        3. Adjust the shoulders and neck naturally to support the new head position.
        4. Maintain 100% facial identity - do not change facial features.
        5. Intensity Level: ${straightenIntensity}/1.0.
        ${userPrompt ? `Additional Instruction: ${userPrompt}` : ""}
        STYLE: Photorealistic, High-end studio portrait quality.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { 
              parts: [
                { inlineData: { data: originalBase64, mimeType: 'image/jpeg' } },
                { text: straightenPrompt }
              ] 
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imagePart) throw new Error("No image generated.");
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    } catch (e) { throw new Error("Failed to straighten face."); }
};

export const generateLifestyleImage = async (
    originalFile: File,
    settings: GenerationSettings
): Promise<string> => {
    try {
        const ai = getAI(settings.modelType, settings.customApiKey);
        let originalBase64 = await resizeImage(originalFile);
        const { lifestyleTheme = "Paris Travel", userPrompt, enableUpscale } = settings;

        const prompt = `
        TASK: AI LIFESTYLE & TRAVEL PHOTO SYNTHESIS.
        SUBJECT: PRESERVE 100% IDENTITY of the person in the source image.
        THEME: ${lifestyleTheme}.
        ${userPrompt ? `CONTEXT: ${userPrompt}` : ""}
        
        RULES:
        1. Seamlessly integrate the subject into the high-end travel or lifestyle environment.
        2. Professional cinematic lighting, realistic depth of field, and natural skin textures.
        3. Maintain original facial structure and expressions perfectly.
        4. ${enableUpscale ? "ENABLE 'CodeFormer' FACE ENHANCEMENT." : ""}
        STYLE: High-quality professional photography, travel influencer style.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { 
              parts: [
                { inlineData: { data: originalBase64, mimeType: 'image/jpeg' } },
                { text: prompt }
              ] 
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imagePart) throw new Error("No image generated.");
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    } catch (e) { throw new Error("Failed to generate lifestyle photo."); }
};

export const generateMockupImage = async (
    originalFile: File,
    settings: GenerationSettings
): Promise<string> => {
    try {
        const ai = getAI(settings.modelType, settings.customApiKey);
        let originalBase64 = await resizeImage(originalFile);
        const { mockupTheme = "Store Shelf", userPrompt, enableUpscale } = settings;

        const prompt = `
        TASK: PROFESSIONAL SALES DESIGN MOCKUP GENERATION.
        SUBJECT: The design/content from the source image.
        ENVIRONMENT THEME: ${mockupTheme}.
        ${userPrompt ? `SPECIFIC CONTEXT: ${userPrompt}` : ""}
        
        CORE INSTRUCTIONS:
        1. Place the design/content from the source image onto a high-quality mockup in the specified environment.
        2. Ensure the design follows the perspective, lighting, and textures of the physical object it's placed on.
        3. The result should look like a professional product photograph for marketing.
        4. Maintain clear legibility of any text or logos from the original design.
        5. ${enableUpscale ? "APPLY HIGH-DEFINITION TEXTURE ENHANCEMENT." : ""}
        
        STYLE: High-end commercial photography, clean, minimalist, and realistic.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { 
              parts: [
                { inlineData: { data: originalBase64, mimeType: 'image/jpeg' } },
                { text: prompt }
              ] 
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imagePart) throw new Error("No image generated.");
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    } catch (e) { throw new Error("Failed to generate mockup."); }
};

export const generateLightingEffectImage = async (
    originalFile: File,
    settings: GenerationSettings
): Promise<string> => {
    try {
        const ai = getAI(settings.modelType, settings.customApiKey);
        let originalBase64 = await resizeImage(originalFile);
        const { lightTheme = "Studio Soft", userPrompt, lightIntensity = 0.8, enableUpscale } = settings;

        const prompt = `
        TASK: AI CINEMATIC LIGHTING RE-RENDERING.
        SUBJECT: PRESERVE 100% IDENTITY of the subject.
        LIGHTING STYLE: ${lightTheme}.
        INTENSITY: ${lightIntensity}/1.0.
        ${userPrompt ? `ADDITIONAL LIGHTING INSTRUCTION: ${userPrompt}` : ""}
        
        SPECIAL INSTRUCTION: 
        If you see any areas highlighted with a bright colored brush (like red, green, or neon colors), these are the SPECIFIC AREAS where the new lighting effect should be focused or originate from.
        
        RULES:
        1. Re-render the lighting of the image according to the specified style.
        2. Focus the lighting effects on the areas highlighted by the brush if present.
        3. Shadows, highlights, and rim lighting must follow the new light source naturally.
        4. Maintain skin texture and all original facial features exactly.
        5. The lighting should feel integrated and realistic, not like a simple filter.
        6. ${enableUpscale ? "ENABLE 'CodeFormer' FACE ENHANCEMENT." : ""}
        
        STYLE: Professional high-end cinematography, master photography lighting.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { 
                parts: [
                    { inlineData: { data: originalBase64, mimeType: 'image/jpeg' } },
                    { text: prompt }
                ] 
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imagePart) throw new Error("No image generated.");
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    } catch (e) { throw new Error("Failed to generate lighting effect."); }
};

export const generateRemoveBackgroundImage = async (
    originalFile: File,
    settings: GenerationSettings
): Promise<string> => {
    try {
        const ai = getAI(settings.modelType, settings.customApiKey);
        let originalBase64 = await resizeImage(originalFile);
        const { userPrompt, enableUpscale, removeBackgroundMode = 'remove-bg' } = settings;

        let prompt = "";
        if (removeBackgroundMode === 'remove-object') {
            prompt = `
            TASK: AI OBJECT REMOVAL & INPAINTING.
            INSTRUCTION: 
            1. Analyze the image and identify the areas highlighted with a colored brush (usually red, green, or bright colors).
            2. Remove the people or objects covered by these highlighted areas.
            3. Seamlessly fill in the removed areas using content-aware inpainting.
            4. The background, textures, and lighting must continue naturally into the filled areas.
            5. Maintain 100% of the rest of the image - do not change anything else.
            ${userPrompt ? `Additional Instruction: ${userPrompt}` : ""}
            
            STYLE: Professional photo retouching, seamless object removal.
            `;
        } else if (removeBackgroundMode === 'clean-bg') {
            const { cleanBgIntensity = 0.85, cleanBgRemoveDetails, cleanBgEvenColor, cleanBgReduceNoise, cleanBgSharpen, cleanBgCustomPrompt } = settings;
            
            const cleanupModules = [];
            if (cleanBgRemoveDetails) cleanupModules.push("- Tẩy các chi tiết thừa, vật thể nhỏ gây xao nhãng ở phông nền.");
            if (cleanBgEvenColor) cleanupModules.push("- Làm đều màu phông nền, xử lý các vùng màu loang lổ hoặc không đồng nhất.");
            if (cleanBgReduceNoise) cleanupModules.push("- Giảm Noise/Nhiễu hạt, làm mịn phông nền nhưng vẫn giữ được độ chân thực.");
            if (cleanBgSharpen) cleanupModules.push("- Tăng độ nét phông, khôi phục các chi tiết nền bị mờ nhòe một cách tự nhiên.");

            prompt = `
            TASK: AI BACKGROUND CLEANUP & PROFESSIONAL RETOUCHING.
            INSTRUCTION: 
            1. Analyze the image and identify the main subject.
            2. Clean the background with INTENSITY: ${cleanBgIntensity}/1.0.
            3. Apply the following cleanup modules:
            ${cleanupModules.join('\n            ')}
            4. Maintain the overall color scheme and lighting of the original background unless specified otherwise.
            5. The goal is to make the background look cleaner, more professional, and "studio-quality" while keeping the main subject perfectly intact.
            ${cleanBgCustomPrompt ? `6. CUSTOM REQUEST: ${cleanBgCustomPrompt}` : ""}
            ${userPrompt ? `7. ADDITIONAL CONTEXT: ${userPrompt}` : ""}
            
            ${enableUpscale ? "APPLY HIGH-DEFINITION TEXTURE ENHANCEMENT & EDGE REFINEMENT." : ""}
            STYLE: Professional studio cleanup, high-end commercial photo retouching.
            `;
        } else {
            prompt = `
            TASK: BACKGROUND REMOVAL & SUBJECT ISOLATION.
            INSTRUCTION: 
            1. Identify the main subject in the image.
            2. Remove the existing background completely.
            3. Replace the background with a pure, solid, high-key white color (#FFFFFF).
            4. Ensure clean edges around hair and fine details.
            5. DO NOT change the subject - absolute preservation of features and clothing.
            ${userPrompt ? `Additional Edge Info: ${userPrompt}` : ""}
            
            ${enableUpscale ? "APPLY EDGE SHARPENING & CLEANUP." : ""}
            STYLE: Clean product photography cutout style.
            `;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { 
              parts: [
                { inlineData: { data: originalBase64, mimeType: 'image/jpeg' } },
                { text: prompt }
              ] 
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imagePart) throw new Error("No image generated.");
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    } catch (e) { throw new Error("Failed to remove background."); }
};

export const generateSymmetricEditImage = async (
    originalFile: File,
    settings: GenerationSettings
): Promise<string> => {
    try {
        const ai = getAI(settings.modelType, settings.customApiKey);
        let originalBase64 = await resizeImage(originalFile);
        const { symmetryIntensity = 0.8, balanceMode = 'full', userPrompt, enableUpscale } = settings;

        const prompt = `
        TASK: AI STRUCTURAL BALANCE & PROPORTIONAL SYMMETRY.
        INSTRUCTION: 
        1. Analyze the subject's structure based on mode: ${balanceMode}.
        2. Apply symmetry correction to features (eyes, nose, mouth, ears) while strictly maintaining the person's unique identity.
        3. Correct minor postural tilts or limb length discrepancies to align with professional photography standards.
        4. Intensity of correction: ${symmetryIntensity}/1.0.
        5. Ensure natural results - avoid the "uncanny valley" effect by keeping organic irregularities that define identity.
        ${userPrompt ? `Custom Balance Instruction: ${userPrompt}` : ""}
        
        ${enableUpscale ? "ENABLE 'CodeFormer' FACE ENHANCEMENT." : ""}
        STYLE: Master-level professional portrait retouching, structural integrity.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { 
              parts: [
                { inlineData: { data: originalBase64, mimeType: 'image/jpeg' } },
                { text: prompt }
              ] 
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imagePart) throw new Error("No image generated.");
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    } catch (e) { throw new Error("Failed to apply symmetric balance."); }
};

export const generateBabyUltrasoundImage = async (
    fatherFile: File,
    motherFile: File,
    settings: GenerationSettings
): Promise<string> => {
    try {
        const ai = getAI(settings.modelType, settings.customApiKey);
        let fatherBase64 = await resizeImage(fatherFile);
        let motherBase64 = await resizeImage(motherFile);
        const { babyGender = 'ngau-nhien', babyStyle = 'realistic', userPrompt, enableUpscale, babyFacialDetailIntensity = 0.8, babyStrictFeatures = false, modelType } = settings;

        const genderPrompt = babyGender === 'nam' ? "Male (Boy)" : babyGender === 'nu' ? "Female (Girl)" : "Random (Boy or Girl)";
        const stylePrompt = babyStyle === 'ultrasound' ? "3D Cinematic Medical Ultrasound rendering style" : "High-definition newborn portrait photography style";

        const selectedModel = (modelType === 'pro-image') ? 'gemini-3.1-pro-preview' : (modelType === 'nano') ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';

        const strictPrompt = babyStrictFeatures ? `
        !!! SURGICAL FIDELITY RECONSTRUCTION - ABSOLUTE BIOLOGICAL CLONING !!!
        - DIGITAL FORENSIC ARTIST ROLE: Analyze anatomical data points.
        - SKIN RENDERING: Apply "Subsurface Scattering" for realistic translucency.
        - LIGHTING: Soft Rembrandt lighting setup.
        - ANATOMICAL MAPPING: Map the exact genetic landmarks from both parents onto the infant's facial skeleton.
        - DETAIL: Cinema 4D level rendering, highly detailed skin texture, pores, and fine moisture.
        ` : "";

        const prompt = `
        TASK: AI INFANT PHENOTYPE PREDICTION.
        SUBJECT A: Father's image provided.
        SUBJECT B: Mother's image provided.
        
        CORE INSTRUCTIONS:
        1. Deeply analyze the facial structure, skin tone, eye shape, and nose features of both parents.
        2. Synthesize and predict a realistic infant/newborn face that inherits genetic traits from both parents.
        3. Gender: ${genderPrompt}.
        4. Rendering Style: ${stylePrompt}.
        5. Facial Detail Fidelity Level: ${babyFacialDetailIntensity}/1.0.
        ${strictPrompt}
        6. The result should be emotionally warm and high-quality.
        ${userPrompt ? `Specific Parent-Child Inheritance Request: ${userPrompt}` : ""}
        
        ${enableUpscale ? "APPLY ULTRA-HIGH 8K TEXTURE & SKIN REFINEMENT." : ""}
        STYLE: Masterpiece baby photography, pure and heartwarming atmosphere.
        `;

        const response = await ai.models.generateContent({
            model: selectedModel,
            contents: { 
              parts: [
                { text: "Image of the Father:" },
                { inlineData: { data: fatherBase64, mimeType: 'image/jpeg' } },
                { text: "Image of the Mother:" },
                { inlineData: { data: motherBase64, mimeType: 'image/jpeg' } },
                { text: prompt }
              ] 
            },
            config: (modelType === 'pro-image' || modelType === 'nano') ? { imageConfig: { imageSize: '4K', aspectRatio: 'auto' } } : undefined
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imagePart) throw new Error("No image generated.");
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    } catch (e) { throw new Error("Failed to predict baby appearance."); }
};

export const generateBabyFromUltrasoundImage = async (
    ultrasoundFile: File,
    settings: GenerationSettings
): Promise<string> => {
    try {
        const ai = getAI(settings.modelType, settings.customApiKey);
        let ultrasoundBase64 = await resizeImage(ultrasoundFile);
        const { ultrasoundTask = 'predict-face', userPrompt, enableUpscale, babyFacialDetailIntensity = 0.8, babyStrictFeatures = false, modelType } = settings;

        const selectedModel = (modelType === 'pro-image') ? 'gemini-3.1-pro-preview' : (modelType === 'nano') ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';

        const strictPrompt = babyStrictFeatures ? `
        !!! ULTRA-PRECISION FACE-CENTERED RECONSTRUCTION !!!
        - FOCUS DIRECTIVE: Prioritize the 3D topology of the baby's CENTRAL FACE.
        - SURFACE MAPPING: Treat high-intensity pixels in the ultrasound as the definitive facial surface. 
        - NOSE & LIPS: Replicate the exact width of the nostrils and the thickness of the vermilion border of the lips.
        - EYE SOCKETS: Capture the precise orbital distance and eyelid contours shown in the scan data.
        - MO ĐỆM (TISSUES): Maintain the surrounding anatomical context (amniotic fluid/placenta) as a secondary layer, but render the FACE with 4K skin clarity.
        - ZERO ALTERATION: Do not "beautify" or smooth out unique facial bumps or characteristics. It must be a 1:1 render of THIS fetus.
        ` : "";

        let prompt = "";
        if (ultrasoundTask === 'predict-face') {
            prompt = `
            TASK: MEDICAL 4D/5D ULTRASOUND TO PHOTOREALISTIC BABY FACE.
            INPUT: 4D Ultrasound scan showing facial volume.
            INSTRUCTION: 
            1. Perform a "Surface Wrap" reconstruction: Convert ultrasound voxel data into realistic human skin textures.
            2. FOCUS ON FACE: Ensure the face is the clearest part of the image, with visible pores and fine facial hair (lanugo).
            3. EXPRESSION: Capture the subtle lip curl or eye squint present in the scan.
            4. Fidelity: ${babyFacialDetailIntensity}/1.0.
            ${strictPrompt}
            5. Final Style: Professional infant portrait with soft studio lighting and realistic 4K skin depth.
            ${userPrompt ? `Refinement: ${userPrompt}` : ""}
            ${enableUpscale ? "ENABLE ULTRA-SHARP 8K FACE RECONSTRUCTION PROTOCOL." : ""}
            `;
        } else {
            prompt = `
            TASK: 5D ULTRASOUND HD-LIVE CRYSTAL CLARITY ENHANCEMENT.
            INPUT: Raw 4D/5D Ultrasound scan.
            INSTRUCTION:
            1. Use AI to denoise medical grain while SHARPENING FACIAL TOPOLOGY.
            2. Make the baby's face clearly visible, separated from surrounding tissues by enhanced medical lighting (Golden Hour Live style).
            3. Detail Intensity: ${babyFacialDetailIntensity}/1.0.
            ${strictPrompt}
            4. Result must look like the most high-definition 5D medical imaging ever recorded.
            ${userPrompt ? `Refinement: ${userPrompt}` : ""}
            ${enableUpscale ? "APPLY MEDICAL-GRADE TEXTURE UPSCALING." : ""}
            `;
        }

        const response = await ai.models.generateContent({
            model: selectedModel,
            contents: { 
              parts: [
                { inlineData: { data: ultrasoundBase64, mimeType: 'image/jpeg' } },
                { text: prompt }
              ] 
            },
            config: (modelType === 'pro-image' || modelType === 'nano') ? { imageConfig: { imageSize: '4K', aspectRatio: 'auto' } } : undefined
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imagePart) throw new Error("No image generated.");
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    } catch (e) { throw new Error("Failed to process ultrasound."); }
};

export const generateArchitectureRenderImage = async (
    originalFile: File,
    settings: GenerationSettings
): Promise<string> => {
    try {
        const ai = getAI(settings.modelType, settings.customApiKey);
        let originalBase64 = await resizeImage(originalFile);
        const { archStyle = "Modern", archType = "interior", userPrompt, enableUpscale } = settings;

        const prompt = `
        TASK: AI ARCHITECTURAL 3D RENDERING.
        INPUT: Transforming the provided architectural sketch/photo into a professional high-end 3D render.
        SPECIFICATIONS:
        - Style: ${archStyle}.
        - Type: ${archType === 'interior' ? 'Interior Design' : 'Exterior/Building Facade'}.
        - Lighting: Ray-traced, cinematic lighting, realistic global illumination.
        - materials: PBR materials (concrete, glass, wood, marble) with realistic textures.
        ${userPrompt ? `Additional Design Instruction: ${userPrompt}` : ""}
        
        CORE RULES:
        1. Maintain the basic geometry and layout from the input image strictly.
        2. Add professional architectural elements: furniture (for interior), landscaping (for exterior).
        3. Realistic environment: sky, neighboring buildings, or room context.
        4. ${enableUpscale ? "APPLY ULTRA-HD TEXTURE UPSCALING." : ""}
        
        STYLE: Architectural Digest quality, professional VRay/Lumion/Twinmotion render style.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { 
              parts: [
                { inlineData: { data: originalBase64, mimeType: 'image/jpeg' } },
                { text: prompt }
              ] 
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imagePart) throw new Error("No image generated.");
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    } catch (e) { throw new Error("Failed to render architecture."); }
};

export const generateUpscaleExpandImage = async (
    originalFile: File,
    settings: GenerationSettings
): Promise<string> => {
    try {
        const ai = getAI(settings.modelType, settings.customApiKey);
        let originalBase64 = await resizeImage(originalFile);
        const { upscaleIntensity = 0.8, expandDirection = 'all', userPrompt, enableUpscale } = settings;

        const prompt = `
        TASK: AI IMAGE UPSCALING, SHARPENING & OUTPAINTING EXPANSION.
        SUBJECT: PRESERVE 100% IDENTITY and original details.
        
        INSTRUCTIONS:
        1. SHARPENING: Increase image resolution and clarity. Emulate high-end optical sharpening.
        2. UPSCALING: Enhance textures, skin details, and edges to look like 4K/8K quality.
        3. EXPANSION (OUTPAINTING): Expand the image boundaries in the direction: ${expandDirection}.
        4. CONTENT AWARE FILL: The expanded areas must seamlessly continue the existing environment, background, and lighting.
        5. Intensity Level: ${upscaleIntensity}/1.0.
        ${userPrompt ? `Additional Context for Expansion: ${userPrompt}` : ""}
        
        RULES:
        - Maintain original subject proportions and colors perfectly.
        - No artifacts or blurry transitions between original and expanded areas.
        - ${enableUpscale ? "ENABLE 'CodeFormer' FACE ENHANCEMENT." : ""}
        
        STYLE: Ultra-high definition, professional photography, seamless outpainting.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { 
                parts: [
                    { inlineData: { data: originalBase64, mimeType: 'image/jpeg' } },
                    { text: prompt }
                ] 
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imagePart) throw new Error("No image generated.");
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    } catch (e) { throw new Error("Failed to upscale and expand image."); }
};

export const generateStyledImage = async (
  originalFile: File,
  settings: GenerationSettings
): Promise<string> => {
  try {
    const { 
        userPrompt, blurAmount, weather, lightingEffects, 
        minimalCustomization, enableUpscale, restorationCustomPrompt,
        modelType, imageSize, aspectRatio, isPortraitFocus,
        preservePose, preserveComposition, preserveFocalLength, preserveAspectRatio,
        disableForeground, preserveSubjectPosition, keepOriginalOutfit,
        subjectMatchSceneColor, sceneMatchSubjectColor, creativeEffect, effectIntensity
    } = settings;

    const ai = getAI(modelType, settings.customApiKey);
    const selectedModel = (modelType === 'pro-image') ? 'gemini-3.1-pro-preview' : (modelType === 'nano') ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';
    
    let originalBase64 = await resizeImage(originalFile);
    let mimeType = originalFile.type;
    if (mimeType !== 'image/png' && mimeType !== 'image/webp') mimeType = 'image/jpeg';

    let targetRatio = "1:1";
    let effectiveImageSize: any = imageSize;

    if (modelType === 'pro-image' || modelType === 'nano') {
        if (aspectRatio && aspectRatio !== 'auto') {
            targetRatio = aspectRatio;
        } else {
            targetRatio = await getProAutoRatio(originalFile);
        }
    }

    const preservationFlags = [];
    if (preservePose) preservationFlags.push("PRESERVE SUBJECT POSE: Keep the exact body posture and limb positions.");
    if (preserveComposition) preservationFlags.push("PRESERVE COMPOSITION: Maintain the overall layout and spatial arrangement of elements.");
    if (preserveFocalLength) preservationFlags.push("PRESERVE FOCAL LENGTH: Keep the same camera perspective and lens compression.");
    if (preserveAspectRatio) preservationFlags.push("PRESERVE ASPECT RATIO: Ensure the subject's proportions are not stretched or squashed.");
    if (disableForeground) preservationFlags.push("DISABLE FOREGROUND: Remove any elements in front of the subject.");
    if (preserveSubjectPosition) preservationFlags.push("PRESERVE SUBJECT POSITION: Keep the subject in the exact same location within the frame.");
    if (keepOriginalOutfit) preservationFlags.push("KEEP ORIGINAL OUTFIT: Do not change the subject's clothing or accessories.");
    if (subjectMatchSceneColor) preservationFlags.push("SUBJECT MATCH SCENE COLOR: Adjust the subject's lighting and color to blend with the new background.");
    if (sceneMatchSubjectColor) preservationFlags.push("SCENE MATCH SUBJECT COLOR: Adjust the background colors to complement the subject.");

    const preservationPrompt = preservationFlags.length > 0 
        ? `\n[PRESERVATION COMMANDS]:\n${preservationFlags.join('\n')}` 
        : "";

    const effectPrompt = creativeEffect 
        ? `\n[CREATIVE EFFECT]: ${creativeEffect} (Intensity: ${effectIntensity || 0.5}/1.0)` 
        : "";

    const weatherPrompt = weather !== WeatherOption.NONE 
        ? `\n[WEATHER CONDITION]: ${weather}` 
        : "";

    const lightingPrompt = lightingEffects.length > 0 
        ? `\n[LIGHTING EFFECTS]: ${lightingEffects.join(', ')}` 
        : "";

    const upscalePrompt = enableUpscale 
        ? `\n[SYSTEM ACTIVATION]: ENABLE 'CodeFormer' FACE ENHANCEMENT. ${JSON.stringify(CODEFORMER_EMULATION_PROMPT, null, 2)}` 
        : "";

    const restorationFlags = [];
    if (settings.restoHairDetail) restorationFlags.push("Vẽ lại tóc chi tiết, sắc nét từng sợi, giữ nếp tóc tự nhiên.");
    if (settings.restoClothingDetail) restorationFlags.push("Vẽ lại trang phục chi tiết, khôi phục kết cấu vải, nếp gấp quần áo chân thực.");
    if (settings.restoAsianBlackHair) restorationFlags.push("Đặc điểm người Châu Á: Tóc đen tuyền, tông da vàng tự nhiên, mắt đen.");
    if (settings.restoUpscaleVr2) restorationFlags.push("Kích hoạt Upscale Vr2: Tăng cường độ phân giải cực cao, làm mịn khối nhưng giữ chi tiết bề mặt.");
    if (settings.restoRealEsrgan) restorationFlags.push("Sử dụng thuật toán Real-ESRGAN để khử nhiễu và làm nét cạnh sắc sảo.");
    if (settings.restoAdvancedNhc) restorationFlags.push("PHỤC CHẾ NÂNG CAO NHC PHOTOSHOP: Xử lý hậu kỳ chuyên sâu, cân bằng màu sắc và ánh sáng đẳng cấp studio.");
    if (settings.restoSuperPortrait) restorationFlags.push("SIÊU CHÂN DUNG: Tập trung tối đa vào đôi mắt, làn da và biểu cảm khuôn mặt, tạo độ sâu trường ảnh nghệ thuật.");
    if (settings.restoQualityEnhance) restorationFlags.push("TĂNG CHẤT LƯỢNG TỔNG THỂ: Cải thiện dynamic range, độ tương phản và độ bão hòa màu sắc hài hòa.");

    const restorationFlagsPrompt = restorationFlags.length > 0 
        ? `\n[RESTORATION MODULES ACTIVATED]:\n${restorationFlags.join('\n')}` 
        : "";

    const userRefinementPrompt = (settings.restoEnableAdvanced && restorationCustomPrompt) 
        ? `\n[SPECIFIC USER REFINEMENT]:\n${restorationCustomPrompt}` 
        : "";

    const portraitCommand = isPortraitFocus 
        ? `\n[MỆNH LỆNH TỐI THƯỢNG]: CHỈ ĐỂ LẠI MÔ TẢ VẬT LIỆU + MÀU NỀN BÊN SAU NGƯỜI MẪU.`
        : "";

    const finalBlur = blurAmount;
    const blurPrompt = finalBlur <= 3.5 ? "STRONG BOKEH" : finalBlur <= 8.0 ? "MEDIUM DOF" : "SHARP BG";

    const finalPrompt = `
    TASK: IMAGE EDITING & RESTORATION.
    SUBJECT: PRESERVE 100% IDENTITY.
    TARGET CONCEPT: ${userPrompt || "Cinematic background"}
    ${portraitCommand}
    ${upscalePrompt}
    ${preservationPrompt}
    ${effectPrompt}
    ${weatherPrompt}
    ${lightingPrompt}
    ${restorationFlagsPrompt}
    ${blurPrompt}
    ${userRefinementPrompt}
    `;

    const response = await ai.models.generateContent({
      model: selectedModel, 
      contents: { parts: [{ inlineData: { mimeType, data: originalBase64 } }, { text: finalPrompt }] },
      config: (modelType === 'pro-image' || modelType === 'nano') ? { imageConfig: { imageSize: effectiveImageSize, aspectRatio: targetRatio } } : undefined
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    return `data:${imagePart?.inlineData?.mimeType || 'image/png'};base64,${imagePart?.inlineData?.data}`;

  } catch (error) { throw new Error("Failed to generate image."); }
};

export const generateBackgroundSwapImage = async (
    originalFile: File,
    settings: GenerationSettings
): Promise<string> => {
    try {
        const ai = getAI(settings.modelType, settings.customApiKey);
        const { userPrompt, referenceImage, modelType, imageSize, aspectRatio, enableUpscale, preserveFace = true } = settings;
        const selectedModel = (modelType === 'pro-image') ? 'gemini-3.1-pro-preview' : (modelType === 'nano') ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';

        let originalBase64 = await resizeImage(originalFile);
        let mimeType = originalFile.type;
        if (mimeType !== 'image/png' && mimeType !== 'image/webp') mimeType = 'image/jpeg';

        const contentParts: any[] = [];
        
        const systemPrompt = `
        ROLE: Expert Visual Effects Artist specializing in Background Replacement.
        TASK: Replace the background of the provided Image A.
        
        SPECIAL INSTRUCTION: 
        If you see any areas highlighted with a bright colored brush (like red, green, or neon colors), these are objects, people, or distractions that MUST BE REMOVED and replaced by the new background.
        
        RULES: 
        1. SUBJECT LOCK: Keep the main subject (the one NOT highlighted) exactly as they are.
        2. ${preserveFace ? "IDENTITY PRESERVATION: Maintain 100% of the original facial features, eyes, nose, and mouth. Do not modify the person's identity." : "GENERAL SUBJECT PRESERVATION: Keep the person recognizable but allow for minor artistic adjustments to blend with the new background."}
        3. SEAMLESS BLENDING: Ensure the subject's lighting and shadows match the new background.
        4. DEPTH OF FIELD: Apply realistic blur to the background if appropriate.
        ${enableUpscale ? JSON.stringify(CODEFORMER_EMULATION_PROMPT) : ""}
        `;

        contentParts.push({ text: systemPrompt + (userPrompt ? `\nTarget Background Description: ${userPrompt}` : "") });
        contentParts.push({ inlineData: { data: originalBase64, mimeType } });

        if (referenceImage) {
            const refBase64 = await resizeImage(referenceImage);
            contentParts.push({ text: "Reference Background:" });
            contentParts.push({ inlineData: { data: refBase64, mimeType: referenceImage.type } });
        }

        const response = await ai.models.generateContent({
            model: selectedModel,
            contents: { parts: contentParts },
            config: (modelType === 'pro-image' || modelType === 'nano') ? { imageConfig: { imageSize: imageSize, aspectRatio: aspectRatio === 'auto' ? '1:1' : aspectRatio } } : undefined
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imagePart) throw new Error("No image generated.");
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    } catch (e) { throw new Error("Lỗi khi thay nền AI."); }
};

export const analyzeRestorationImage = async (file: File): Promise<string> => {
  try {
    const ai = getAI();
    const base64Data = await resizeImage(file, 1024, 1024, 0.8);
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: { 
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } }, 
          { text: "Phân tích tấm ảnh phục chế này và đề xuất phương án tối ưu." } 
        ] 
      }
    });
    return response.text?.trim() || "";
  } catch (error) { throw new Error("Không thể phân tích."); }
};

export const generatePaintingImage = async (originalFile: File, settings: GenerationSettings): Promise<string> => {
    try {
        const { userPrompt, modelType, imageSize, aspectRatio, paintingStyle, paintingQualityEnhance, referenceImage, customApiKey } = settings;
        const ai = getAI(modelType, customApiKey);
        const selectedModel = (modelType === 'pro-image') ? 'gemini-3.1-pro-preview' : (modelType === 'nano') ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';
        
        let originalBase64 = await resizeImage(originalFile);
        let mimeType = originalFile.type;
        if (mimeType !== 'image/png' && mimeType !== 'image/webp') mimeType = 'image/jpeg';

        const contentParts: any[] = [];
        
        const systemPrompt = `
        ROLE: Master Fine Art Painter & Digital Illustrator.
        TASK: Transform the provided Image A into a high-end artistic painting.
        
        STYLE SPECIFICATIONS:
        - Primary Style: ${paintingStyle || "Oil Painting"}
        - Artistic Direction: ${userPrompt || "Create a masterpiece painting based on the subject."}
        
        RULES:
        1. COMPOSITION LOCK: Maintain the original subject's pose, facial structure, and overall composition from Image A.
        2. ARTISTIC TEXTURE: Apply rich, realistic artistic textures (brushstrokes, canvas grain, watercolor bleeds, etc.) characteristic of the selected style.
        3. LIGHTING & COLOR: Enhance the lighting and color palette to be more dramatic and artistic while staying true to the original subject.
        4. ${paintingQualityEnhance ? "ENHANCED QUALITY: Apply 'CodeFormer' style refinement to ensure the subject's face remains clear and recognizable within the artistic style." : ""}
        
        OUTPUT: A single, high-resolution artistic painting.
        `;

        contentParts.push({ text: systemPrompt });
        contentParts.push({ inlineData: { data: originalBase64, mimeType } });

        if (referenceImage) {
            const refBase64 = await resizeImage(referenceImage);
            contentParts.push({ text: "Style Reference Image (Emulate this specific artistic style):" });
            contentParts.push({ inlineData: { data: refBase64, mimeType: referenceImage.type } });
        }

        const response = await ai.models.generateContent({
            model: selectedModel,
            contents: { parts: contentParts },
            config: modelType === 'pro-image' ? { imageConfig: { imageSize: imageSize, aspectRatio: aspectRatio === 'auto' ? '1:1' : aspectRatio } } : undefined
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imagePart) throw new Error("No image generated.");
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    } catch(e) { throw new Error("Lỗi khi tạo tranh nghệ thuật AI."); }
}

export const generateProfileImage = async (originalFile: File, settings: ProfileSettings): Promise<string> => {
    try {
        const ai = getAI();
        let originalBase64 = await resizeImage(originalFile);
        
        const { gender, subject, attire, hairstyle, hairColor, background, beautifyLevel, customPrompt, enableUpscale, customBackgroundColor, customAttireImage } = settings;

        const finalBackground = background === 'TÙY CHỈNH' && customBackgroundColor 
            ? `Solid background with the specific color code: ${customBackgroundColor}`
            : `${background} Background`;

        const attireDescription = attire === 'TÙY CHỈNH' && customAttireImage
            ? "Use the clothing from the provided attire reference image."
            : `${attire}`;

        const profilePrompt = `
        TASK: PROFESSIONAL AI PROFILE PHOTO GENERATION.
        IDENTITY LOCK: 100% PRESERVATION. DO NOT CHANGE FACE STRUCTURE.
        
        SPECIFICATIONS:
        - Gender: ${gender === 'nam' ? 'Male' : 'Female'}
        - Age Category: ${subject === 'nguoi-lon' ? 'Adult' : subject === 'thanh-nien' ? 'Youth' : 'Child'}
        - Clothing: ${attireDescription}
        - Hairstyle: ${hairstyle}
        - Hair Color: ${hairColor}
        - Background: ${finalBackground}
        - Skin Beautification: level ${beautifyLevel}/100 (smooth skin, professional retouching).
        - Additional Request: ${customPrompt || "None"}
        
        RULES:
        - Result must look like a professional studio headshot or ID photo.
        - High-end cinematic lighting.
        - Background should be professional and solid as requested.
        - ${enableUpscale ? "ENABLE 'CodeFormer' FACE ENHANCEMENT." : ""}
        `;

        const contentParts: Part[] = [
            { inlineData: { data: originalBase64, mimeType: 'image/jpeg' } },
            { text: profilePrompt }
        ];

        if (attire === 'TÙY CHỈNH' && customAttireImage) {
            const attireBase64 = await resizeImage(customAttireImage);
            contentParts.push({ text: "Attire Reference Image:" });
            contentParts.push({ inlineData: { data: attireBase64, mimeType: 'image/jpeg' } });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { 
              parts: contentParts 
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imagePart) throw new Error("No image generated.");
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    } catch (error) { throw new Error("Failed to generate profile photo."); }
};

export const preprocessClothImage = async (file: File): Promise<Part> => {
    try {
        const ai = getAI();
        const initialPart = await fileToPart(file);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [initialPart, { text: "Isolate clothing, remove human." }] },
        });
        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        return { inlineData: { data: imagePart!.inlineData!.data, mimeType: imagePart!.inlineData!.mimeType } };
    } catch (error) { return await fileToPart(file); }
};

export const analyzeImageText = async (file: File, type: 'background' | 'pose'): Promise<string> => {
    try {
        const ai = getAI();
        const imagePart = await fileToPart(file);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, { text: `Analyze ${type} of this image in Vietnamese.` }] },
        });
        return response.text || "";
    } catch (error) { return ""; }
};

export const generateClothingSwap = async (personImage: Part, clothImage: Part, backgroundDesc: string | null, positionDesc: string | null, aspectRatio: string, customPromptText: string, enableUpscale: boolean): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [personImage, clothImage, { text: "Clothing swap task." }] },
        });
        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        return `data:${imagePart?.inlineData?.mimeType || 'image/png'};base64,${imagePart?.inlineData?.data}`;
    } catch (error) { throw error; }
};

export const refineClothingResult = async (resultImagePart: Part, prompt: string, aspectRatio: string, enableUpscale: boolean): Promise<string> => {
     try {
            const ai = getAI();
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [resultImagePart, { text: prompt }] },
            });
            const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
            return `data:${imagePart?.inlineData?.mimeType || 'image/png'};base64,${imagePart?.inlineData?.data}`;
     } catch (error) { throw error; }
}

export const analyzeReferenceImage = async (file: File, mode: 'basic' | 'deep' | 'full' | 'painting' = 'basic'): Promise<string> => {
  try {
    const ai = getAI();
    const base64Data = await resizeImage(file, 1024, 1024, 0.8);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Data } }, { text: `Analyze style for ${mode} in Vietnamese.` }] }
    });
    return response.text?.trim() || "";
  } catch (error) { throw new Error("Fail."); }
};

export const generateSpeech = async (text: string, voiceId: string): Promise<string | null> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } } },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) { throw error; }
};

export const translateText = async (text: string, targetLanguage: string = 'Vietnamese'): Promise<string> => {
  if (!text.trim()) return '';
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate to ${targetLanguage}: ${text}`,
    });
    return response.text || "";
  } catch (error) { throw error; }
};
