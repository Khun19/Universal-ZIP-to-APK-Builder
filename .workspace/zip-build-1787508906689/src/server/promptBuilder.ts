export interface PromptOptions {
  styleId: string;
  gender: 'masculine' | 'feminine' | 'neutral';
  attire: string;
  framing: string;
  expression: string;
}

export const BACKGROUND_BLOCKS: Record<string, string> = {
  corporate_grey: 'seamless neutral grey studio backdrop with soft gradient falloff',
  modern_tech_office: 'shallow depth of field blurred open-office background, glass partitions, soft window bokeh',
  outdoor_natural: 'soft golden hour lighting, blurred greenery or urban background, natural sun flare',
  studio_white: 'pure white seamless backdrop, even soft lighting, no harsh shadows',
  executive_navy: 'dark navy gradient backdrop, dramatic rim lighting',
};

export const ATTIRE_BLOCKS: Record<string, Record<string, string>> = {
  business_suit: {
    masculine: 'wearing a bespoke charcoal Italian wool suit, tailored dark navy lapels, crisp pressed white dress shirt with silk necktie',
    feminine: 'wearing an impeccably tailored black executive blazer jacket over an ivory silk collared blouse',
    neutral: 'wearing a sharp structured tailored blazer with clean architectural lines over a crisp formal dress shirt',
  },
  business_casual: {
    masculine: 'wearing a tailored navy sport coat over an open-collar French-blue dress shirt with no tie',
    feminine: 'wearing a chic tailored blazer in rich neutral tones layered over a soft silk shell top',
    neutral: 'wearing a modern unstructured blazer layered over a refined minimal collar shirt',
  },
  smart_casual: {
    masculine: 'wearing a fine-gauge charcoal merino wool crewneck layered over an Oxford cotton shirt',
    feminine: 'wearing an elegant dark cashmere crewneck sweater with delicate minimalist jewelry accents',
    neutral: 'wearing a premium heavyweight minimalist knit sweater in rich heather charcoal',
  },
  executive_blazer: {
    masculine: 'wearing a structured double-breasted midnight wool blazer with subtle peak lapels and pocket square',
    feminine: 'wearing a sharp tailored tuxedo-cut blazer with satin shawl lapel over a black silk camisole',
    neutral: 'wearing a sharp minimalist architectural jacket with concealed placket and sleek silhouette',
  },
  minimalist_knit: {
    masculine: 'wearing a fitted dark slate mock-neck sweater made of fine organic merino wool',
    feminine: 'wearing a sleek ribbed black turtleneck sweater framing the neck and jawline',
    neutral: 'wearing a clean textured minimalist mock-neck knit in deep obsidian',
  },
};

export const FRAMING_BLOCKS: Record<string, string> = {
  head_shoulders: 'classic head and shoulders composition framed from the mid-chest upward, subject centered with balanced negative space above head',
  half_body: 'waist-up half-body executive portrait composition showing relaxed confident posture and full torso attire details',
  cinematic_close_up: 'tight cinematic portrait framing close to collarbones, focusing closely on captivating eye catchlights and refined facial geometry with smooth lens compression',
};

export const EXPRESSION_BLOCKS: Record<string, string> = {
  confident_approachable: 'a confident yet genuine approachable expression with relaxed facial muscles, gentle micro-smile, and warm, direct eye contact with the camera',
  warm_smile: 'a warm, authentic friendly smile showing subtle teeth, natural crinkle around the eyes (Duchenne smile), radiating charisma and reliability',
  serious_executive: 'a poised and determined executive demeanor with focused gaze, composed jawline, and authoritative intellectual presence',
  calm_neutral: 'a calm, collected, and dignified facial expression with poised symmetry and refined elegance',
};

export const NEGATIVE_PROMPT =
  'plastic skin, waxy texture, symmetrical idealized face, airbrushed, over-smoothed, extra fingers, warped ears, uncanny valley, mismatched lighting, cartoonish, oversaturated';

/**
 * Prompt builder adhering strictly to the studio headshot prompt architecture.
 */
export function buildPrompt(options: PromptOptions): { prompt: string; negativePrompt: string } {
  const bg = BACKGROUND_BLOCKS[options.styleId] || BACKGROUND_BLOCKS['corporate_grey'];
  const attireGroup = ATTIRE_BLOCKS[options.attire] || ATTIRE_BLOCKS['business_suit'];
  const attire = attireGroup[options.gender] || attireGroup['neutral'] || attireGroup['masculine'];
  const framing = FRAMING_BLOCKS[options.framing] || FRAMING_BLOCKS['head_shoulders'];
  const expression = EXPRESSION_BLOCKS[options.expression] || EXPRESSION_BLOCKS['confident_approachable'];

  const prompt = `A photorealistic professional headshot portrait, shot on an 85mm f/1.4 lens, studio photography. Preserve the exact facial structure, eye shape, nose, jawline, and skin tone of the reference photos provided — this must clearly be the same person, not an idealized or generic face. Maintain natural skin texture including visible pores and subtle asymmetry; no plastic or airbrushed skin. Soft key light at 45 degrees with natural catchlights in the eyes. ${bg}. ${attire}. ${framing}. Expressing ${expression}. Natural color grading, no oversaturation, no HDR effect.`;

  return {
    prompt,
    negativePrompt: NEGATIVE_PROMPT,
  };
}
