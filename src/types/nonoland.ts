export type Language = 'ar' | 'en';

export type AgeGroupId = '3-4' | '5-6' | '7' | '8';

export type WorldId =
  | 'arabic-letters'
  | 'english-letters'
  | 'numbers-kingdom'
  | 'animal-jungle'
  | 'colors-shapes'
  | 'intelligence-castle'
  | 'science-galaxy'
  | 'healthy-body'
  | 'life-skills'
  | 'creativity-island';

export type SkillId =
  | 'early-recognition'
  | 'arabic-literacy'
  | 'english-literacy'
  | 'numeracy'
  | 'math-reasoning'
  | 'logic-patterns'
  | 'science-discovery'
  | 'memory-focus'
  | 'life-health'
  | 'creativity-expression';

export type GameMechanic =
  | 'visual-tap'
  | 'memory-match'
  | 'sequence-builder'
  | 'math-lab'
  | 'maze-explorer'
  | 'drawing-studio'
  | 'music-rhythm'
  | 'sort-classify';

export type NonoMood =
  | 'idle'
  | 'waving'
  | 'jumping'
  | 'thinking'
  | 'excited'
  | 'encouraging'
  | 'celebrating'
  | 'sleeping'
  | 'listening'
  | 'dancing'
  | 'surprised';

export type AppScreen =
  | 'splash'
  | 'onboarding'
  | 'parent-auth'
  | 'create-child'
  | 'child-welcome'
  | 'baseline-assessment'
  | 'home'
  | 'academy'
  | 'fun-zone'
  | 'map'
  | 'world-detail'
  | 'game'
  | 'game-results'
  | 'discovery-lab'
  | 'assessment-results'
  | 'stories'
  | 'story-reader'
  | 'my-room'
  | 'achievements'
  | 'parent-dashboard';

export type ConceptDomain = 'arabic' | 'english' | 'numbers' | 'colors-shapes';

export type ConceptMasteryStage = 'exposed' | 'recognized' | 'recalled' | 'applied';

export interface ConceptRecord {
  conceptId: string;
  domain: ConceptDomain;
  label: LocalizedText;
  stage: ConceptMasteryStage;
  exposures: number;
  correctCount: number;
  mistakesCount: number;
  lastPracticedAt: string;
}

export interface CharacterOutfit {
  characterId: 'nono' | 'lolo' | 'leo' | 'bobo' | 'ellie' | 'titi';
  hat: string;
  outfit: string;
  accessory: string;
  backdropColor: string;
}

export type YouTubeCategory = 'stories' | 'cartoons' | 'songs' | 'adventures';

export interface CuratedYouTubeVideo {
  id: string;
  videoId: string;
  title: LocalizedText;
  category: YouTubeCategory;
  ageGroups: AgeGroupId[];
  approvedByParent: boolean;
  featured: boolean;
  addedAt: string;
}

export interface LocalizedText {
  ar: string;
  en: string;
}

export interface ParentAccount {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  isDemoMode: boolean;
}

export interface ParentSettings {
  language: Language;
  musicEnabled: boolean;
  sfxVolume: number; // 0 to 1
  voiceNarration: boolean;
  muted: boolean;
  dailyScreenTimeMinutes: number;
  allowLocalAudioSynthesis: boolean;
  offlineSyncEnabled: boolean;
}

export interface SubscriptionState {
  tier: 'free' | 'monthly' | 'quarterly' | 'annual';
  status: 'active' | 'preview';
  renewsAt?: string;
}

export interface SkillProgress {
  skillId: SkillId;
  attempts: number;
  correctCount: number;
  accuracy: number; // 0 - 100
  streak: number;
  masteryLevel: 'exploring' | 'growing' | 'confident' | 'mastered';
  lastPracticedAt?: string;
}

export interface LearningAttempt {
  id: string;
  activityId: string;
  worldId: WorldId;
  skillId: SkillId;
  ageGroup: AgeGroupId;
  score: number;
  maxScore: number;
  accuracy: number;
  durationSeconds: number;
  starsEarned: number;
  completedAt: string;
  synced: boolean;
}

export interface AssessmentResult {
  id: string;
  childId: string;
  ageGroup: AgeGroupId;
  mode: 'baseline' | 'lab';
  date: string;
  questionsCompleted: number;
  correctAnswers: number;
  skillBreakdown: Partial<Record<SkillId, { correct: number; total: number }>>;
  recommendedWorldId: WorldId;
  recommendedActivityId: string;
  starsEarned: number;
}

export interface PlacedRoomItem {
  instanceId: string;
  itemId: string;
  x: number; // percentage 10-90
  y: number; // percentage 15-85
}

export interface SavedDrawing {
  id: string;
  title: string;
  dataUrl: string;
  createdAt: string;
}

export interface ChildProfile {
  id: string;
  displayName: string;
  birthYear: number;
  birthMonth: number;
  ageGroup: AgeGroupId;
  language: Language;
  interests: string[];
  companionId: string;
  companionScarfColor: string;
  stars: number;
  level: number;
  completedBaseline: boolean;
  favoriteWorldId?: WorldId;
  recentActivityId?: string;
  unlockedWorlds: WorldId[];
  completedActivityIds: string[];
  unlockedCharacters: string[];
  unlockedBadges: string[];
  unlockedRoomItems: string[];
  placedRoomItems: PlacedRoomItem[];
  savedDrawings: SavedDrawing[];
  certificates: Certificate[];
  skillProgress: Record<SkillId, SkillProgress>;
  conceptMastery?: Record<string, ConceptRecord>;
  characterOutfits?: Record<string, CharacterOutfit>;
  unlockedFunRewards?: string[];
  attempts: LearningAttempt[];
  assessmentHistory: AssessmentResult[];
  completedStoryIds: string[];
  completedMissionsToday: string[];
  totalLearningMinutes: number;
  downloadedWorldIds: WorldId[];
}

export interface LearningWorld {
  id: WorldId;
  name: LocalizedText;
  subtitle: LocalizedText;
  description: LocalizedText;
  guardianName: LocalizedText;
  guardianEmoji: string;
  primaryColor: string;
  secondaryColor: string;
  bgGradient: string;
  mapPosition: { x: number; y: number }; // percentage on adventure map
  primarySkill: SkillId;
  isPremium?: boolean;
  unlockRequirementStars: number;
  levelsCount: number;
  certificateTitle: LocalizedText;
}

export interface GameChoiceOption {
  id: string;
  label: LocalizedText;
  visual: string; // emoji, Arabic/English letter, number, or color swatch hex
  isColorSwatch?: boolean;
  isCorrect?: boolean;
  audioCue?: LocalizedText;
  category?: string;
}

export interface GameQuestion {
  id: string;
  prompt: LocalizedText;
  hint: LocalizedText;
  visualCue?: string;
  options?: GameChoiceOption[];
  targetCount?: number;
  countEmoji?: string;
  sequenceItems?: string[]; // ordered sequence
  sequenceAnswer?: string[];
  pairs?: Array<{ id: string; left: string; right: string; label?: LocalizedText }>;
  sortBuckets?: Array<{ id: string; label: LocalizedText; emoji: string }>;
  sortItems?: Array<{ id: string; label: LocalizedText; visual: string; bucketId: string }>;
  mazeGrid?: number[][]; // 0 path, 1 wall, 2 start, 3 goal
  musicSequence?: number[]; // indices 0..4
}

export interface GameActivity {
  id: string;
  worldId: WorldId;
  level: number;
  title: LocalizedText;
  objective: LocalizedText;
  instructions: LocalizedText;
  mechanic: GameMechanic;
  skillId: SkillId;
  ageEligibility: AgeGroupId[];
  difficulty: 1 | 2 | 3;
  estimatedMinutes: number;
  isPremium?: boolean;
  questions: GameQuestion[];
  drawingPrompt?: LocalizedText;
}

export interface StoryChoice {
  id: string;
  label: LocalizedText;
  nextSceneId: string;
  educationalTag?: LocalizedText;
}

export interface StoryScene {
  id: string;
  text: LocalizedText;
  illustrationEmoji: string;
  bgMood: string;
  nonoLine: LocalizedText;
  choices?: StoryChoice[];
  isEnding?: boolean;
  rewardStars?: number;
}

export interface Story {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  ageEligibility: AgeGroupId[];
  worldId: WorldId;
  coverEmoji: string;
  accentColor: string;
  isPremium?: boolean;
  scenes: Record<string, StoryScene>;
  startSceneId: string;
}

export interface RoomItem {
  id: string;
  name: LocalizedText;
  category: 'furniture' | 'plant' | 'toy' | 'trophy' | 'companion';
  emoji: string;
  unlockHint: LocalizedText;
  starsCost?: number;
  earnedByWorld?: WorldId;
}

export interface CharacterCompanion {
  id: string;
  name: LocalizedText;
  role: LocalizedText;
  worldId: WorldId;
  emoji: string;
  color: string;
  personality: LocalizedText;
}

export interface RewardBadge {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  emoji: string;
  color: string;
  ruleDescription: LocalizedText;
}

export interface Certificate {
  id: string;
  uniqueCode: string;
  childName: string;
  worldId: WorldId;
  worldName: LocalizedText;
  achievementTitle: LocalizedText;
  issuedAt: string;
  levelCompleted: number;
}

export interface DailyMission {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  targetWorldId: WorldId;
  targetActivityId: string;
  rewardStars: number;
  icon: string;
}

export interface ParentInsight {
  id: string;
  type: 'strength' | 'practice' | 'recommendation';
  text: LocalizedText;
}
