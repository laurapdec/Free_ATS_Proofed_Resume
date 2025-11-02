// Premium feature flags and their descriptions
export const PREMIUM_FEATURES = {
  ATS_SCORE_ANALYSIS: 'ATS_SCORE_ANALYSIS',
  COVER_LETTER_GEN: 'COVER_LETTER_GEN',
  RESUME_OPTIMIZATION: 'RESUME_OPTIMIZATION',
  INTERVIEW_PREP: 'INTERVIEW_PREP',
  JOB_MATCH: 'JOB_MATCH',
  MULTI_CV: 'MULTI_CV',
} as const;

export type PremiumFeature = keyof typeof PREMIUM_FEATURES;

// Premium tiers configuration
export const PREMIUM_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export type PremiumTier = keyof typeof PREMIUM_TIERS;

// Premium features available in each tier
export const TIER_FEATURES: Record<PremiumTier, PremiumFeature[]> = {
  FREE: [],
  BASIC: [
    PREMIUM_FEATURES.ATS_SCORE_ANALYSIS,
    PREMIUM_FEATURES.RESUME_OPTIMIZATION,
  ],
  PRO: [
    PREMIUM_FEATURES.ATS_SCORE_ANALYSIS,
    PREMIUM_FEATURES.RESUME_OPTIMIZATION,
    PREMIUM_FEATURES.COVER_LETTER_GEN,
    PREMIUM_FEATURES.JOB_MATCH,
  ],
  ENTERPRISE: [
    PREMIUM_FEATURES.ATS_SCORE_ANALYSIS,
    PREMIUM_FEATURES.RESUME_OPTIMIZATION,
    PREMIUM_FEATURES.COVER_LETTER_GEN,
    PREMIUM_FEATURES.JOB_MATCH,
    PREMIUM_FEATURES.INTERVIEW_PREP,
    PREMIUM_FEATURES.MULTI_CV,
  ],
};

// Feature descriptions and benefits
export const FEATURE_DETAILS = {
  [PREMIUM_FEATURES.ATS_SCORE_ANALYSIS]: {
    name: 'ATS Score Analysis',
    description: 'Get detailed insights into how well your resume performs against ATS systems',
    benefits: [
      'Real-time ATS compatibility score',
      'Keyword optimization suggestions',
      'Format compatibility check',
      'Section-by-section analysis'
    ],
  },
  [PREMIUM_FEATURES.COVER_LETTER_GEN]: {
    name: 'AI Cover Letter Generator',
    description: 'Generate tailored cover letters using advanced AI',
    benefits: [
      'Job-specific customization',
      'Multiple style options',
      'Tone adjustment',
      'Highlight relevant experiences'
    ],
  },
  [PREMIUM_FEATURES.RESUME_OPTIMIZATION]: {
    name: 'Resume Optimization',
    description: 'AI-powered suggestions to improve your resume',
    benefits: [
      'Content improvement suggestions',
      'Skills gap analysis',
      'Industry-specific optimization',
      'Achievement quantification help'
    ],
  },
  [PREMIUM_FEATURES.INTERVIEW_PREP]: {
    name: 'Interview Preparation',
    description: 'Comprehensive interview preparation tools',
    benefits: [
      'AI mock interviews',
      'Common questions database',
      'Industry-specific preparation',
      'Feedback and improvement tips'
    ],
  },
  [PREMIUM_FEATURES.JOB_MATCH]: {
    name: 'Job Matching',
    description: 'Find the perfect job matches for your profile',
    benefits: [
      'AI-powered job recommendations',
      'Skills match analysis',
      'Career path suggestions',
      'Salary insights'
    ],
  },
  [PREMIUM_FEATURES.MULTI_CV]: {
    name: 'Multiple CV Management',
    description: 'Create and manage multiple versions of your CV',
    benefits: [
      'Unlimited CV versions',
      'Role-specific customization',
      'Version comparison',
      'Industry-specific templates'
    ],
  },
};

// Pricing configuration (monthly, in USD)
export const TIER_PRICING = {
  FREE: 0,
  BASIC: 9.99,
  PRO: 19.99,
  ENTERPRISE: 49.99,
} as const;

// Helper functions
export function isFeatureAvailable(feature: PremiumFeature, userTier: PremiumTier): boolean {
  return TIER_FEATURES[userTier].includes(feature);
}

export function getAvailableFeatures(userTier: PremiumTier): PremiumFeature[] {
  return TIER_FEATURES[userTier];
}

export function getTierFromFeature(feature: PremiumFeature): PremiumTier[] {
  return Object.entries(TIER_FEATURES)
    .filter(([_, features]) => features.includes(feature))
    .map(([tier]) => tier as PremiumTier);
}

export function getLowestTierWithFeature(feature: PremiumFeature): PremiumTier | null {
  const tiers = getTierFromFeature(feature);
  if (tiers.length === 0) return null;
  
  // Sort tiers by price to find the lowest tier
  return tiers.sort((a, b) => TIER_PRICING[a] - TIER_PRICING[b])[0];
}

// Usage limits configuration
export const USAGE_LIMITS: Record<PremiumFeature, Record<PremiumTier, number>> = {
  [PREMIUM_FEATURES.ATS_SCORE_ANALYSIS]: {
    FREE: 1,
    BASIC: Infinity,
    PRO: Infinity,
    ENTERPRISE: Infinity,
  },
  [PREMIUM_FEATURES.COVER_LETTER_GEN]: {
    FREE: 0,
    BASIC: 3,
    PRO: 10,
    ENTERPRISE: Infinity,
  },
  [PREMIUM_FEATURES.RESUME_OPTIMIZATION]: {
    FREE: 1,
    BASIC: Infinity,
    PRO: Infinity,
    ENTERPRISE: Infinity,
  },
  [PREMIUM_FEATURES.INTERVIEW_PREP]: {
    FREE: 0,
    BASIC: 0,
    PRO: 0,
    ENTERPRISE: Infinity,
  },
  [PREMIUM_FEATURES.JOB_MATCH]: {
    FREE: 0,
    BASIC: 0,
    PRO: Infinity,
    ENTERPRISE: Infinity,
  },
  [PREMIUM_FEATURES.MULTI_CV]: {
    FREE: 1,
    BASIC: 3,
    PRO: 5,
    ENTERPRISE: Infinity,
  },
} as const;

export function getFeatureLimit(feature: PremiumFeature, tier: PremiumTier): number {
  return USAGE_LIMITS[feature]?.[tier] ?? Infinity;
}

// Subscription management helpers
export interface SubscriptionStatus {
  tier: PremiumTier;
  expiresAt: Date;
  isActive: boolean;
  usageStats: Partial<Record<PremiumFeature, number>>;
}

export function canUseFeature(
  feature: PremiumFeature,
  subscription: SubscriptionStatus
): boolean {
  if (!subscription.isActive) return false;
  if (!isFeatureAvailable(feature, subscription.tier)) return false;
  
  const limit = getFeatureLimit(feature, subscription.tier);
  const usage = subscription.usageStats[feature] ?? 0;
  
  return usage < limit;
}

export function getUpgradeRecommendation(
  currentTier: PremiumTier,
  desiredFeature: PremiumFeature
): PremiumTier | null {
  if (isFeatureAvailable(desiredFeature, currentTier)) return null;
  return getLowestTierWithFeature(desiredFeature);
}