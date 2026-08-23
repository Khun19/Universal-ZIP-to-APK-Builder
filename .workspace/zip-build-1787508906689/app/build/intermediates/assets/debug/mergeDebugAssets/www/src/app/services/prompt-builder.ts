import {
  AttireType,
  ExpressionOption,
  FramingOption,
  GenderPresentation,
  StyleOption,
} from '../models/headshot.models';

export const HEADSHOT_STYLES: StyleOption[] = [
  {
    id: 'corporate_grey',
    name: 'Corporate Grey Backdrop',
    category: 'Studio Classic',
    tagline: 'Timeless executive standard for Fortune 500 & Board profiles',
    description: 'Clean medium neutral grey studio gradient with soft 45° key light falloff and crisp shoulder separation.',
    backgroundPrompt: 'seamless neutral grey studio backdrop with soft gradient falloff',
    lightingBadge: '45° Studio Key + Rim',
    accentColor: '#64748b',
    previewUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    isPopular: true,
  },
  {
    id: 'modern_tech_office',
    name: 'Modern Tech Office',
    category: 'Modern Workspace',
    tagline: 'Polished startup founder & technology leader aesthetic',
    description: 'Contemporary architectural glass partitions, open workspace bokeh, soft ambient window lighting.',
    backgroundPrompt: 'shallow depth of field blurred open-office background, glass partitions, soft window bokeh',
    lightingBadge: 'Natural Window + Fill',
    accentColor: '#0284c7',
    previewUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
    isPopular: true,
  },
  {
    id: 'outdoor_natural',
    name: 'Outdoor Natural Light',
    category: 'Outdoor Natural',
    tagline: 'Approachable, warm, and authentic golden hour atmosphere',
    description: 'Lush diffused greenery, subtle architectural depth, organic golden sunlight with soft catchlights.',
    backgroundPrompt: 'soft golden hour lighting, blurred greenery or urban background, natural sun flare',
    lightingBadge: 'Golden Hour Diffused',
    accentColor: '#d97706',
    previewUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    isPopular: true,
  },
  {
    id: 'studio_white',
    name: 'Studio White Background',
    category: 'Studio Classic',
    tagline: 'High-key crisp, modern minimalism for press & speakers',
    description: 'Pure seamless white studio infinity curve, balanced double-diffused lighting, no harsh shadows.',
    backgroundPrompt: 'pure white seamless backdrop, even soft lighting, no harsh shadows',
    lightingBadge: 'High-Key Dual Diffuser',
    accentColor: '#475569',
    previewUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'executive_navy',
    name: 'Executive Dark Navy Backdrop',
    category: 'Executive Luxury',
    tagline: 'Commanding presence for partners, counsel & keynote bios',
    description: 'Deep midnight navy gradient backdrop, subtle hair rim light, sophisticated dramatic contrast.',
    backgroundPrompt: 'dark navy gradient backdrop, dramatic rim lighting',
    lightingBadge: 'Dramatic Chiaroscuro Rim',
    accentColor: '#1e3a8a',
    previewUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    isPopular: true,
  },
];

export const ATTIRE_OPTIONS: {
  id: AttireType;
  label: string;
  description: string;
  genderVariants: Record<GenderPresentation, string>;
}[] = [
  {
    id: 'business_suit',
    label: 'Business Suit',
    description: 'Traditional corporate executive tailoring with sharp lapels and premium fabric',
    genderVariants: {
      masculine: 'wearing a bespoke charcoal Italian wool suit, tailored dark navy lapels, crisp pressed white dress shirt with silk necktie',
      feminine: 'wearing an impeccably tailored black executive blazer jacket over an ivory silk collared blouse',
      neutral: 'wearing a sharp structured tailored blazer with clean architectural lines over a crisp formal dress shirt',
    },
  },
  {
    id: 'business_casual',
    label: 'Business Casual',
    description: 'Modern leadership style, open collar with tailored jacket or knit blazer',
    genderVariants: {
      masculine: 'wearing a tailored navy sport coat over an open-collar French-blue dress shirt with no tie',
      feminine: 'wearing a chic tailored blazer in rich neutral tones layered over a soft silk shell top',
      neutral: 'wearing a modern unstructured blazer layered over a refined minimal collar shirt',
    },
  },
  {
    id: 'smart_casual',
    label: 'Smart Casual',
    description: 'Contemporary tech / creative attire with premium knitwear and textures',
    genderVariants: {
      masculine: 'wearing a fine-gauge charcoal merino wool crewneck layered over an Oxford cotton shirt',
      feminine: 'wearing an elegant dark cashmere crewneck sweater with delicate minimalist jewelry accents',
      neutral: 'wearing a premium heavyweight minimalist knit sweater in rich heather charcoal',
    },
  },
  {
    id: 'executive_blazer',
    label: 'Executive Blazer',
    description: 'High-contrast statement tailoring for board members and keynote speakers',
    genderVariants: {
      masculine: 'wearing a structured double-breasted midnight wool blazer with subtle peak lapels and pocket square',
      feminine: 'wearing a sharp tailored tuxedo-cut blazer with satin shawl lapel over a black silk camisole',
      neutral: 'wearing a sharp minimalist architectural jacket with concealed placket and sleek silhouette',
    },
  },
  {
    id: 'minimalist_knit',
    label: 'Minimalist Knit',
    description: 'Apple/Scandinavian executive aesthetic with clean organic textures',
    genderVariants: {
      masculine: 'wearing a fitted dark slate mock-neck sweater made of fine organic merino wool',
      feminine: 'wearing a sleek ribbed black turtleneck sweater framing the neck and jawline',
      neutral: 'wearing a clean textured minimalist mock-neck knit in deep obsidian',
    },
  },
];

export const FRAMING_OPTIONS: {
  id: FramingOption;
  label: string;
  description: string;
  promptBlock: string;
  icon: string;
}[] = [
  {
    id: 'head_shoulders',
    label: 'Head & Shoulders',
    description: 'Standard corporate / LinkedIn profile photo composition (chest up)',
    promptBlock: 'classic head and shoulders composition framed from the mid-chest upward, subject centered with balanced negative space above head',
    icon: 'account_box',
  },
  {
    id: 'half_body',
    label: 'Half Body',
    description: 'Executive bio and speaker profile framing (waist up)',
    promptBlock: 'waist-up half-body executive portrait composition showing relaxed confident posture and full torso attire details',
    icon: 'accessibility_new',
  },
  {
    id: 'cinematic_close_up',
    label: 'Cinematic Close-up',
    description: 'High-impact artistic portrait highlighting facial expression and eyes',
    promptBlock: 'tight cinematic portrait framing close to collarbones, focusing closely on captivating eye catchlights and refined facial geometry with smooth lens compression',
    icon: 'center_focus_strong',
  },
];

export const EXPRESSION_OPTIONS: {
  id: ExpressionOption;
  label: string;
  description: string;
  promptBlock: string;
}[] = [
  {
    id: 'confident_approachable',
    label: 'Confident & Approachable',
    description: 'Warm micro-smile, relaxed jaw, engaging eye contact',
    promptBlock: 'a confident yet genuine approachable expression with relaxed facial muscles, gentle micro-smile, and warm, direct eye contact with the camera',
  },
  {
    id: 'warm_smile',
    label: 'Warm Friendly Smile',
    description: 'Natural open smile radiating warmth and trustworthiness',
    promptBlock: 'a warm, authentic friendly smile showing subtle teeth, natural crinkle around the eyes (Duchenne smile), radiating charisma and reliability',
  },
  {
    id: 'serious_executive',
    label: 'Serious Executive',
    description: 'Commanding, focused, analytical leadership presence',
    promptBlock: 'a poised and determined executive demeanor with focused gaze, composed jawline, and authoritative intellectual presence',
  },
  {
    id: 'calm_neutral',
    label: 'Calm & Poised',
    description: 'Serene, dignified, modern editorial look',
    promptBlock: 'a calm, collected, and dignified facial expression with poised symmetry and refined elegance',
  },
];

export const NEGATIVE_PROMPT =
  'plastic skin, waxy texture, symmetrical idealized face, airbrushed, over-smoothed, extra fingers, warped ears, uncanny valley, mismatched lighting, cartoonish, oversaturated, deformed pupils, bad anatomy, double chin, blurry, watermark, signature, lowres';

/**
 * Builds the comprehensive prompt for image generation based on selected parameters.
 */
export function buildHeadshotPrompt(options: {
  styleId: string;
  gender: GenderPresentation;
  attire: AttireType;
  framing: FramingOption;
  expression: ExpressionOption;
}): { prompt: string; negativePrompt: string } {
  const style = HEADSHOT_STYLES.find((s) => s.id === options.styleId) || HEADSHOT_STYLES[0];
  const attireObj = ATTIRE_OPTIONS.find((a) => a.id === options.attire) || ATTIRE_OPTIONS[0];
  const framingObj = FRAMING_OPTIONS.find((f) => f.id === options.framing) || FRAMING_OPTIONS[0];
  const expressionObj = EXPRESSION_OPTIONS.find((e) => e.id === options.expression) || EXPRESSION_OPTIONS[0];

  const attireBlock = attireObj.genderVariants[options.gender] || attireObj.genderVariants.neutral;
  const backgroundBlock = style.backgroundPrompt;
  const framingBlock = framingObj.promptBlock;
  const expressionBlock = expressionObj.promptBlock;

  const prompt = `A photorealistic professional headshot portrait, shot on an 85mm f/1.4 lens, studio photography. Preserve the exact facial structure, eye shape, nose, jawline, and skin tone of the reference photos provided — this must clearly be the same person, not an idealized or generic face. Maintain natural skin texture including visible pores and subtle asymmetry; no plastic or airbrushed skin. Soft key light at 45 degrees with natural catchlights in the eyes. ${backgroundBlock}. ${attireBlock}. ${framingBlock}. Expressing ${expressionBlock}. Natural color grading, no oversaturation, no HDR effect, masterclass Hasselblad color science.`;

  return {
    prompt,
    negativePrompt: NEGATIVE_PROMPT,
  };
}
