import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createInitialSkillProgress,
  createSampleChildProfiles,
  ROOM_ITEMS,
} from '../data/rewardsAndRoom';
import { getWorldById } from '../data/worlds';
import { DEFAULT_CHARACTER_OUTFITS, INITIAL_CURATED_VIDEOS } from '../data/funZoneData';
import {
  AgeGroupId,
  AppScreen,
  AssessmentResult,
  Certificate,
  CharacterOutfit,
  ChildProfile,
  ConceptDomain,
  ConceptMasteryStage,
  CuratedYouTubeVideo,
  Language,
  LearningAttempt,
  LocalizedText,
  ParentAccount,
  ParentSettings,
  SavedDrawing,
  SkillId,
  SubscriptionState,
  WorldId,
} from '../types/nonoland';
import { soundEngine } from '../utils/soundEngine';

const STORAGE_KEY = 'nonoland_universe_state_v1';

interface PersistedState {
  parentAccount: ParentAccount | null;
  parentSettings: ParentSettings;
  subscription: SubscriptionState;
  children: ChildProfile[];
  activeChildId: string | null;
  simulatedOffline: boolean;
  curatedVideos?: CuratedYouTubeVideo[];
}

const DEFAULT_SETTINGS: ParentSettings = {
  language: 'ar',
  musicEnabled: true,
  sfxVolume: 0.75,
  voiceNarration: true,
  muted: false,
  dailyScreenTimeMinutes: 45,
  allowLocalAudioSynthesis: true,
  offlineSyncEnabled: true,
};

function getInitialPersistedState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed && Array.isArray(parsed.children) && parsed.children.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore corrupted storage
  }
  const sampleChildren = createSampleChildProfiles();
  return {
    parentAccount: {
      id: 'parent-demo-1',
      name: 'عائلة نونو',
      email: 'family@nonoland.local',
      createdAt: new Date().toISOString(),
      isDemoMode: true,
    },
    parentSettings: DEFAULT_SETTINGS,
    subscription: { tier: 'free', status: 'preview' },
    children: sampleChildren,
    activeChildId: sampleChildren[1].id, // Omar (5-6) default or switchable anytime
    simulatedOffline: false,
    curatedVideos: INITIAL_CURATED_VIDEOS,
  };
}

interface NonoLandContextValue {
  screen: AppScreen;
  navigate: (screen: AppScreen, opts?: { worldId?: WorldId; activityId?: string; storyId?: string }) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  parentAccount: ParentAccount | null;
  setParentAccount: (account: ParentAccount) => void;
  parentSettings: ParentSettings;
  updateParentSettings: (patch: Partial<ParentSettings>) => void;
  subscription: SubscriptionState;
  updateSubscription: (tier: SubscriptionState['tier']) => void;
  childrenList: ChildProfile[];
  activeChild: ChildProfile;
  selectChild: (childId: string) => void;
  createChildProfile: (input: {
    displayName: string;
    ageGroup: AgeGroupId;
    language: Language;
    birthYear: number;
    birthMonth: number;
    interests: string[];
    companionId: string;
    companionScarfColor: string;
  }) => ChildProfile;
  updateChildProfile: (childId: string, patch: Partial<ChildProfile>) => void;
  selectedWorldId: WorldId;
  selectedActivityId: string;
  selectedStoryId: string;
  lastAttempt: LearningAttempt | null;
  lastNewlyUnlockedBadge: string | null;
  lastNewlyIssuedCert: Certificate | null;
  lastAssessment: AssessmentResult | null;
  showCelebration: boolean;
  dismissCelebration: () => void;
  recordGameAttempt: (input: {
    activityId: string;
    worldId: WorldId;
    skillId: SkillId;
    score: number;
    maxScore: number;
    durationSeconds: number;
  }) => void;
  recordAssessmentResult: (result: Omit<AssessmentResult, 'id' | 'date'>) => AssessmentResult;
  completeStory: (storyId: string, rewardStars: number) => void;
  saveDrawingToRoom: (drawing: Omit<SavedDrawing, 'id' | 'createdAt'>) => void;
  placeRoomItem: (itemId: string) => void;
  moveRoomItem: (instanceId: string, x: number, y: number) => void;
  removePlacedRoomItem: (instanceId: string) => void;
  toggleDownloadWorld: (worldId: WorldId) => void;
  isOnline: boolean;
  simulatedOffline: boolean;
  setSimulatedOffline: (val: boolean) => void;
  pendingSyncCount: number;
  syncOfflineQueue: () => void;
  resetAllData: () => void;
  recordConceptInteraction: (input: {
    conceptId: string;
    domain: ConceptDomain;
    label: LocalizedText;
    stage: ConceptMasteryStage;
    isCorrect: boolean;
  }) => void;
  updateCharacterOutfit: (characterId: CharacterOutfit['characterId'], patch: Partial<CharacterOutfit>) => void;
  grantFunReward: (stars: number, rewardId?: string) => void;
  curatedVideos: CuratedYouTubeVideo[];
  addCuratedVideo: (video: Omit<CuratedYouTubeVideo, 'id' | 'addedAt'>) => void;
  toggleApproveVideo: (id: string) => void;
  toggleFeatureVideo: (id: string) => void;
  removeCuratedVideo: (id: string) => void;
}

const NonoLandContext = createContext<NonoLandContextValue | null>(null);

export const NonoLandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persisted, setPersisted] = useState<PersistedState>(getInitialPersistedState);
  const [screen, setScreen] = useState<AppScreen>('splash');
  const [selectedWorldId, setSelectedWorldId] = useState<WorldId>('arabic-letters');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('act-ar-letter-tap-34');
  const [selectedStoryId, setSelectedStoryId] = useState<string>('story-lost-starlight-34');
  const [lastAttempt, setLastAttempt] = useState<LearningAttempt | null>(null);
  const [lastNewlyUnlockedBadge, setLastNewlyUnlockedBadge] = useState<string | null>(null);
  const [lastNewlyIssuedCert, setLastNewlyIssuedCert] = useState<Certificate | null>(null);
  const [lastAssessment, setLastAssessment] = useState<AssessmentResult | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  const activeChild = useMemo(() => {
    return (
      persisted.children.find((c) => c.id === persisted.activeChildId) ||
      persisted.children[0]
    );
  }, [persisted.children, persisted.activeChildId]);

  const language: Language = activeChild?.language || persisted.parentSettings.language || 'ar';
  const isOnline = browserOnline && !persisted.simulatedOffline;

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      // Storage quota fallback
    }
  }, [persisted]);

  // Sync HTML dir/lang & sound engine
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    soundEngine.updateSettings({ ...persisted.parentSettings, language });
  }, [language, persisted.parentSettings]);

  // Listen to real online/offline browser events
  useEffect(() => {
    const onOnline = () => setBrowserOnline(true);
    const onOffline = () => setBrowserOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const navigate = (
    nextScreen: AppScreen,
    opts?: { worldId?: WorldId; activityId?: string; storyId?: string },
  ) => {
    soundEngine.playPop();
    soundEngine.stopSpeech();
    if (opts?.worldId) setSelectedWorldId(opts.worldId);
    if (opts?.activityId) setSelectedActivityId(opts.activityId);
    if (opts?.storyId) setSelectedStoryId(opts.storyId);
    setScreen(nextScreen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setLanguage = (lang: Language) => {
    soundEngine.playPop();
    setPersisted((prev) => ({
      ...prev,
      parentSettings: { ...prev.parentSettings, language: lang },
      children: prev.children.map((c) =>
        c.id === activeChild.id ? { ...c, language: lang } : c,
      ),
    }));
  };

  const setParentAccount = (account: ParentAccount) => {
    setPersisted((prev) => ({ ...prev, parentAccount: account }));
  };

  const updateParentSettings = (patch: Partial<ParentSettings>) => {
    setPersisted((prev) => ({
      ...prev,
      parentSettings: { ...prev.parentSettings, ...patch },
    }));
  };

  const updateSubscription = (tier: SubscriptionState['tier']) => {
    setPersisted((prev) => ({
      ...prev,
      subscription: { tier, status: 'preview' },
    }));
  };

  const selectChild = (childId: string) => {
    soundEngine.playPop();
    setPersisted((prev) => ({ ...prev, activeChildId: childId }));
  };

  const createChildProfile: NonoLandContextValue['createChildProfile'] = (input) => {
    const newChild: ChildProfile = {
      id: `child-${Date.now()}`,
      displayName: input.displayName.trim() || (input.language === 'ar' ? 'بطل نونو' : 'Explorer'),
      birthYear: input.birthYear,
      birthMonth: input.birthMonth,
      ageGroup: input.ageGroup,
      language: input.language,
      interests: input.interests,
      companionId: input.companionId || 'nono',
      companionScarfColor: input.companionScarfColor || '#8054D9',
      stars: 3,
      level: 1,
      completedBaseline: false,
      unlockedWorlds: [
        'arabic-letters',
        'english-letters',
        'numbers-kingdom',
        'animal-jungle',
        'colors-shapes',
        'intelligence-castle',
        'science-galaxy',
        'healthy-body',
        'life-skills',
        'creativity-island',
      ],
      completedActivityIds: [],
      unlockedCharacters: ['nono', input.companionId || 'nono'],
      unlockedBadges: [],
      unlockedRoomItems: ['cloud-bed', 'sun-plant'],
      placedRoomItems: [
        { instanceId: `init-1-${Date.now()}`, itemId: 'cloud-bed', x: 28, y: 68 },
        { instanceId: `init-2-${Date.now()}`, itemId: 'sun-plant', x: 72, y: 65 },
      ],
      savedDrawings: [],
      certificates: [],
      skillProgress: createInitialSkillProgress(),
      attempts: [],
      assessmentHistory: [],
      completedStoryIds: [],
      completedMissionsToday: [],
      totalLearningMinutes: 0,
      downloadedWorldIds: ['arabic-letters', 'colors-shapes'],
    };

    setPersisted((prev) => ({
      ...prev,
      parentSettings: { ...prev.parentSettings, language: input.language },
      children: [...prev.children, newChild],
      activeChildId: newChild.id,
    }));
    return newChild;
  };

  const updateChildProfile = (childId: string, patch: Partial<ChildProfile>) => {
    setPersisted((prev) => ({
      ...prev,
      children: prev.children.map((c) => (c.id === childId ? { ...c, ...patch } : c)),
    }));
  };

  const recordGameAttempt: NonoLandContextValue['recordGameAttempt'] = (input) => {
    const accuracy = input.maxScore > 0 ? Math.round((input.score / input.maxScore) * 100) : 100;
    const isFirstCompletion = !activeChild.completedActivityIds.includes(input.activityId);
    const starsEarned = isFirstCompletion ? (accuracy >= 80 ? 3 : 2) : 1;

    const attempt: LearningAttempt = {
      id: `att-${Date.now()}`,
      activityId: input.activityId,
      worldId: input.worldId,
      skillId: input.skillId,
      ageGroup: activeChild.ageGroup,
      score: input.score,
      maxScore: input.maxScore,
      accuracy,
      durationSeconds: Math.max(10, input.durationSeconds),
      starsEarned,
      completedAt: new Date().toISOString(),
      synced: isOnline,
    };

    let unlockedBadge: string | null = null;
    let issuedCert: Certificate | null = null;

    setPersisted((prev) => ({
      ...prev,
      children: prev.children.map((c) => {
        if (c.id !== activeChild.id) return c;

        const nextStars = c.stars + starsEarned;
        const nextLevel = Math.max(1, Math.floor(nextStars / 6) + 1);
        const completedIds = c.completedActivityIds.includes(input.activityId)
          ? c.completedActivityIds
          : [...c.completedActivityIds, input.activityId];

        const prevSkill = c.skillProgress[input.skillId];
        const totalAttempts = prevSkill.attempts + 1;
        const totalCorrect = prevSkill.correctCount + (accuracy >= 70 ? 1 : 0);
        const avgAcc =
          prevSkill.attempts === 0
            ? accuracy
            : Math.round((prevSkill.accuracy * prevSkill.attempts + accuracy) / totalAttempts);
        const nextStreak = accuracy >= 70 ? prevSkill.streak + 1 : 0;
        const masteryLevel =
          totalAttempts >= 4 && avgAcc >= 85
            ? 'mastered'
            : totalAttempts >= 2 && avgAcc >= 75
              ? 'confident'
              : totalAttempts >= 1
                ? 'growing'
                : 'exploring';

        const nextBadges = [...c.unlockedBadges];
        if (!nextBadges.includes('first-spark')) {
          nextBadges.push('first-spark');
          unlockedBadge = 'first-spark';
        }
        if (completedIds.length >= 5 && !nextBadges.includes('five-adventures')) {
          nextBadges.push('five-adventures');
          unlockedBadge = 'five-adventures';
        }
        if (nextStars >= 20 && !nextBadges.includes('star-collector')) {
          nextBadges.push('star-collector');
          unlockedBadge = 'star-collector';
        }

        // Unlock room items earned by star thresholds
        const nextRoomItems = [...c.unlockedRoomItems];
        ROOM_ITEMS.forEach((item) => {
          if (item.starsCost && nextStars >= item.starsCost && !nextRoomItems.includes(item.id)) {
            nextRoomItems.push(item.id);
          }
        });

        // Issue world certificate if 2+ activities completed in this world & no duplicate certificate exists
        const worldAttemptsCount = [...c.attempts, attempt].filter(
          (a) => a.worldId === input.worldId && a.accuracy >= 60,
        ).length;
        const alreadyHasWorldCert = c.certificates.some((cert) => cert.worldId === input.worldId);
        const nextCerts = [...c.certificates];
        if (worldAttemptsCount >= 2 && !alreadyHasWorldCert) {
          const world = getWorldById(input.worldId);
          const cert: Certificate = {
            id: `cert-${input.worldId}-${Date.now()}`,
            uniqueCode: `NL-${input.worldId.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
            childName: c.displayName,
            worldId: input.worldId,
            worldName: world.name,
            achievementTitle: world.certificateTitle,
            issuedAt: new Date().toISOString(),
            levelCompleted: nextLevel,
          };
          nextCerts.push(cert);
          issuedCert = cert;
        }

        // Unlock world companion if applicable
        const nextChars = [...c.unlockedCharacters];
        if (input.worldId === 'animal-jungle' && !nextChars.includes('coco')) nextChars.push('coco');
        if (input.worldId === 'intelligence-castle' && !nextChars.includes('lumi')) nextChars.push('lumi');
        if (input.worldId === 'arabic-letters' && !nextChars.includes('faseeh')) nextChars.push('faseeh');
        if (input.worldId === 'science-galaxy' && !nextChars.includes('astra')) nextChars.push('astra');

        return {
          ...c,
          stars: nextStars,
          level: nextLevel,
          favoriteWorldId: c.favoriteWorldId || input.worldId,
          recentActivityId: input.activityId,
          completedActivityIds: completedIds,
          unlockedBadges: nextBadges,
          unlockedRoomItems: nextRoomItems,
          unlockedCharacters: nextChars,
          certificates: nextCerts,
          attempts: [attempt, ...c.attempts],
          totalLearningMinutes: c.totalLearningMinutes + Math.max(1, Math.round(input.durationSeconds / 60)),
          skillProgress: {
            ...c.skillProgress,
            [input.skillId]: {
              skillId: input.skillId,
              attempts: totalAttempts,
              correctCount: totalCorrect,
              accuracy: avgAcc,
              streak: nextStreak,
              masteryLevel,
              lastPracticedAt: attempt.completedAt,
            },
          },
        };
      }),
    }));

    setLastAttempt(attempt);
    setLastNewlyUnlockedBadge(unlockedBadge);
    setLastNewlyIssuedCert(issuedCert);
    setShowCelebration(true);
    soundEngine.playCelebration();
  };

  const recordAssessmentResult: NonoLandContextValue['recordAssessmentResult'] = (input) => {
    const result: AssessmentResult = {
      ...input,
      id: `assess-${Date.now()}`,
      date: new Date().toISOString(),
    };

    setPersisted((prev) => ({
      ...prev,
      children: prev.children.map((c) => {
        if (c.id !== activeChild.id) return c;
        const nextBadges = c.unlockedBadges.includes('lab-explorer')
          ? c.unlockedBadges
          : [...c.unlockedBadges, 'lab-explorer'];

        const updatedSkills = { ...c.skillProgress };
        (Object.keys(result.skillBreakdown) as SkillId[]).forEach((skillId) => {
          const item = result.skillBreakdown[skillId];
          if (!item || item.total === 0) return;
          const pct = Math.round((item.correct / item.total) * 100);
          const existing = updatedSkills[skillId];
          const nextAttempts = existing.attempts + 1;
          const nextAcc =
            existing.attempts === 0
              ? pct
              : Math.round((existing.accuracy * existing.attempts + pct) / nextAttempts);
          updatedSkills[skillId] = {
            ...existing,
            attempts: nextAttempts,
            correctCount: existing.correctCount + item.correct,
            accuracy: nextAcc,
            masteryLevel: nextAcc >= 85 ? 'confident' : nextAcc >= 60 ? 'growing' : 'exploring',
            lastPracticedAt: result.date,
          };
        });

        return {
          ...c,
          completedBaseline: true,
          stars: c.stars + result.starsEarned,
          unlockedBadges: nextBadges,
          assessmentHistory: [result, ...c.assessmentHistory],
          skillProgress: updatedSkills,
        };
      }),
    }));

    setLastAssessment(result);
    soundEngine.playCelebration();
    return result;
  };

  const completeStory = (storyId: string, rewardStars: number) => {
    setPersisted((prev) => ({
      ...prev,
      children: prev.children.map((c) => {
        if (c.id !== activeChild.id) return c;
        const alreadyCompleted = c.completedStoryIds.includes(storyId);
        const starsAdd = alreadyCompleted ? 1 : rewardStars;
        const nextBadges = c.unlockedBadges.includes('story-weaver')
          ? c.unlockedBadges
          : [...c.unlockedBadges, 'story-weaver'];
        return {
          ...c,
          stars: c.stars + starsAdd,
          completedStoryIds: alreadyCompleted ? c.completedStoryIds : [...c.completedStoryIds, storyId],
          unlockedBadges: nextBadges,
        };
      }),
    }));
    soundEngine.playCelebration();
  };

  const saveDrawingToRoom = (drawing: Omit<SavedDrawing, 'id' | 'createdAt'>) => {
    const fullDrawing: SavedDrawing = {
      ...drawing,
      id: `draw-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPersisted((prev) => ({
      ...prev,
      children: prev.children.map((c) => {
        if (c.id !== activeChild.id) return c;
        const nextBadges = c.unlockedBadges.includes('creative-artist')
          ? c.unlockedBadges
          : [...c.unlockedBadges, 'creative-artist'];
        return {
          ...c,
          stars: c.stars + 2,
          unlockedBadges: nextBadges,
          savedDrawings: [fullDrawing, ...c.savedDrawings].slice(0, 8),
        };
      }),
    }));
    soundEngine.playSuccess();
  };

  const placeRoomItem = (itemId: string) => {
    soundEngine.playPop();
    setPersisted((prev) => ({
      ...prev,
      children: prev.children.map((c) => {
        if (c.id !== activeChild.id) return c;
        const offset = (c.placedRoomItems.length * 13) % 55;
        return {
          ...c,
          placedRoomItems: [
            ...c.placedRoomItems,
            {
              instanceId: `rm-${Date.now()}`,
              itemId,
              x: 20 + offset,
              y: 55 + (c.placedRoomItems.length % 2) * 14,
            },
          ],
        };
      }),
    }));
  };

  const moveRoomItem = (instanceId: string, x: number, y: number) => {
    setPersisted((prev) => ({
      ...prev,
      children: prev.children.map((c) => {
        if (c.id !== activeChild.id) return c;
        return {
          ...c,
          placedRoomItems: c.placedRoomItems.map((p) =>
            p.instanceId === instanceId ? { ...p, x, y } : p,
          ),
        };
      }),
    }));
  };

  const removePlacedRoomItem = (instanceId: string) => {
    soundEngine.playPop();
    setPersisted((prev) => ({
      ...prev,
      children: prev.children.map((c) => {
        if (c.id !== activeChild.id) return c;
        return {
          ...c,
          placedRoomItems: c.placedRoomItems.filter((p) => p.instanceId !== instanceId),
        };
      }),
    }));
  };

  const toggleDownloadWorld = (worldId: WorldId) => {
    soundEngine.playPop();
    setPersisted((prev) => ({
      ...prev,
      children: prev.children.map((c) => {
        if (c.id !== activeChild.id) return c;
        const exists = c.downloadedWorldIds.includes(worldId);
        return {
          ...c,
          downloadedWorldIds: exists
            ? c.downloadedWorldIds.filter((id) => id !== worldId)
            : [...c.downloadedWorldIds, worldId],
        };
      }),
    }));
  };

  const pendingSyncCount = useMemo(() => {
    return persisted.children.reduce(
      (sum, c) => sum + c.attempts.filter((a) => !a.synced).length,
      0,
    );
  }, [persisted.children]);

  const syncOfflineQueue = () => {
    if (!isOnline) return;
    soundEngine.playSuccess();
    setPersisted((prev) => ({
      ...prev,
      children: prev.children.map((c) => ({
        ...c,
        attempts: c.attempts.map((a) => ({ ...a, synced: true })),
      })),
    }));
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = getInitialPersistedState();
    setPersisted(fresh);
    setScreen('splash');
  };

  const recordConceptInteraction: NonoLandContextValue['recordConceptInteraction'] = ({
    conceptId,
    domain,
    label,
    stage,
    isCorrect,
  }) => {
    const stageRank: Record<ConceptMasteryStage, number> = {
      exposed: 1,
      recognized: 2,
      recalled: 3,
      applied: 4,
    };

    setPersisted((prev) => ({
      ...prev,
      children: prev.children.map((c) => {
        if (c.id !== activeChild.id) return c;
        const map = c.conceptMastery || {};
        const existing = map[conceptId];
        const nextStage =
          existing && stageRank[existing.stage] > stageRank[stage]
            ? existing.stage
            : isCorrect
              ? stage
              : existing?.stage || 'exposed';

        return {
          ...c,
          stars: isCorrect && !existing ? c.stars + 1 : c.stars,
          conceptMastery: {
            ...map,
            [conceptId]: {
              conceptId,
              domain,
              label,
              stage: nextStage,
              exposures: (existing?.exposures || 0) + 1,
              correctCount: (existing?.correctCount || 0) + (isCorrect ? 1 : 0),
              mistakesCount: (existing?.mistakesCount || 0) + (isCorrect ? 0 : 1),
              lastPracticedAt: new Date().toISOString(),
            },
          },
        };
      }),
    }));
  };

  const updateCharacterOutfit: NonoLandContextValue['updateCharacterOutfit'] = (
    characterId,
    patch,
  ) => {
    soundEngine.playPop();
    setPersisted((prev) => ({
      ...prev,
      children: prev.children.map((c) => {
        if (c.id !== activeChild.id) return c;
        const outfits = c.characterOutfits || DEFAULT_CHARACTER_OUTFITS;
        const current = outfits[characterId] || DEFAULT_CHARACTER_OUTFITS[characterId];
        return {
          ...c,
          characterOutfits: {
            ...outfits,
            [characterId]: { ...current, ...patch },
          },
        };
      }),
    }));
  };

  const grantFunReward = (stars: number, rewardId?: string) => {
    setPersisted((prev) => ({
      ...prev,
      children: prev.children.map((c) => {
        if (c.id !== activeChild.id) return c;
        const unlocked = c.unlockedFunRewards || [];
        const nextRewards =
          rewardId && !unlocked.includes(rewardId) ? [...unlocked, rewardId] : unlocked;
        return {
          ...c,
          stars: c.stars + stars,
          unlockedFunRewards: nextRewards,
        };
      }),
    }));
  };

  const curatedVideos = persisted.curatedVideos || INITIAL_CURATED_VIDEOS;

  const addCuratedVideo = (video: Omit<CuratedYouTubeVideo, 'id' | 'addedAt'>) => {
    const newVid: CuratedYouTubeVideo = {
      ...video,
      id: `yt-${Date.now()}`,
      addedAt: new Date().toISOString(),
    };
    setPersisted((prev) => ({
      ...prev,
      curatedVideos: [newVid, ...(prev.curatedVideos || INITIAL_CURATED_VIDEOS)],
    }));
  };

  const toggleApproveVideo = (id: string) => {
    setPersisted((prev) => ({
      ...prev,
      curatedVideos: (prev.curatedVideos || []).map((v) =>
        v.id === id ? { ...v, approvedByParent: !v.approvedByParent } : v,
      ),
    }));
  };

  const toggleFeatureVideo = (id: string) => {
    setPersisted((prev) => ({
      ...prev,
      curatedVideos: (prev.curatedVideos || []).map((v) =>
        v.id === id ? { ...v, featured: !v.featured } : v,
      ),
    }));
  };

  const removeCuratedVideo = (id: string) => {
    setPersisted((prev) => ({
      ...prev,
      curatedVideos: (prev.curatedVideos || []).filter((v) => v.id !== id),
    }));
  };

  return (
    <NonoLandContext.Provider
      value={{
        screen,
        navigate,
        language,
        setLanguage,
        parentAccount: persisted.parentAccount,
        setParentAccount,
        parentSettings: persisted.parentSettings,
        updateParentSettings,
        subscription: persisted.subscription,
        updateSubscription,
        childrenList: persisted.children,
        activeChild,
        selectChild,
        createChildProfile,
        updateChildProfile,
        selectedWorldId,
        selectedActivityId,
        selectedStoryId,
        lastAttempt,
        lastNewlyUnlockedBadge,
        lastNewlyIssuedCert,
        lastAssessment,
        showCelebration,
        dismissCelebration: () => setShowCelebration(false),
        recordGameAttempt,
        recordAssessmentResult,
        completeStory,
        saveDrawingToRoom,
        placeRoomItem,
        moveRoomItem,
        removePlacedRoomItem,
        toggleDownloadWorld,
        isOnline,
        simulatedOffline: persisted.simulatedOffline,
        setSimulatedOffline: (val) =>
          setPersisted((prev) => ({ ...prev, simulatedOffline: val })),
        pendingSyncCount,
        syncOfflineQueue,
        resetAllData,
        recordConceptInteraction,
        updateCharacterOutfit,
        grantFunReward,
        curatedVideos,
        addCuratedVideo,
        toggleApproveVideo,
        toggleFeatureVideo,
        removeCuratedVideo,
      }}
    >
      {children}
    </NonoLandContext.Provider>
  );
};

export function useNonoLand() {
  const ctx = useContext(NonoLandContext);
  if (!ctx) throw new Error('useNonoLand must be used inside NonoLandProvider');
  return ctx;
}
