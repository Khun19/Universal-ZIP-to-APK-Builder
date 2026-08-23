export type GenderPresentation = 'masculine' | 'feminine' | 'neutral';

export type AttireType = 'business_suit' | 'business_casual' | 'smart_casual' | 'executive_blazer' | 'minimalist_knit';

export type FramingOption = 'head_shoulders' | 'half_body' | 'cinematic_close_up';

export type ExpressionOption = 'warm_smile' | 'confident_approachable' | 'serious_executive' | 'calm_neutral';

export interface StyleOption {
  id: string;
  name: string;
  category: 'Studio Classic' | 'Modern Workspace' | 'Outdoor Natural' | 'Executive Luxury';
  tagline: string;
  description: string;
  backgroundPrompt: string;
  lightingBadge: string;
  accentColor: string;
  previewUrl: string;
  isPopular?: boolean;
}

export interface PhotoValidationResult {
  faceDetected: boolean;
  score: number; // 0 to 100
  lightingQuality: 'optimal' | 'acceptable' | 'too_dark' | 'too_bright';
  angleQuality: 'frontal' | 'slight_angle' | 'extreme_angle';
  resolutionQuality: 'high' | 'adequate' | 'low';
  feedback: string;
  faceFeaturesDetected?: string[];
}

export interface UploadedPhoto {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
  thumbnailUrl: string;
  mimeType: string;
  width?: number;
  height?: number;
  validationStatus: 'checking' | 'valid' | 'warning' | 'error';
  validationResult?: PhotoValidationResult;
  errorMessage?: string;
  isSamplePreset?: boolean;
}

export interface HeadshotGenerationOptions {
  sessionId: string;
  selectedStyles: string[];
  gender: GenderPresentation;
  attire: AttireType;
  framing: FramingOption;
  expression: ExpressionOption;
  photos: string[]; // Base64 or IDs
  variationsPerStyle?: number;
}

export interface HeadshotResultItem {
  id: string;
  requestId: string;
  styleId: string;
  styleName: string;
  imageUrl: string;
  highResUrl: string;
  originalReferenceUrl: string;
  promptUsed: string;
  attireLabel: string;
  framingLabel: string;
  isFavorite: boolean;
  createdAt: number;
  aspectRatio: string;
  resolution: string;
}

export interface GenerationProgressStep {
  id: string;
  title: string;
  description: string;
  progressPercentage: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
}

export interface GenerationJobStatus {
  jobId: string;
  status: 'queued' | 'validating' | 'processing' | 'completed' | 'error';
  progressPercent: number;
  currentStepIndex: number;
  steps: GenerationProgressStep[];
  results: HeadshotResultItem[];
  errorMessage?: string;
  estimatedSecondsRemaining: number;
  stylesCompleted: number;
  totalStyles: number;
}

export interface UserSessionState {
  sessionId: string;
  email?: string;
  isGuest: boolean;
  freeGenerationsRemaining: number;
  maxDailyGenerations: number;
  uploadedPhotos: UploadedPhoto[];
  selectedStyles: string[];
  gender: GenderPresentation;
  attire: AttireType;
  framing: FramingOption;
  expression: ExpressionOption;
  currentStep: 'upload' | 'style' | 'attire' | 'processing' | 'results';
  activeJob?: GenerationJobStatus;
  historyResults: HeadshotResultItem[];
  privacyConsent: boolean;
}
