import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Check,
  Clock,
  Download,
  ExternalLink,
  Film,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserPlus,
  Users,
  Volume2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useNonoLand } from '../context/NonoLandContext';
import { PARENT_OFFLINE_ACTIVITIES } from '../data/academyData';
import { OFFICIAL_YOUTUBE_CHANNEL } from '../data/funZoneData';
import { LEARNING_WORLDS } from '../data/worlds';
import { generateParentInsights } from '../engine/adaptiveEngine';
import { AGE_GROUP_META, formatDate, formatNumber, SKILL_LABELS, t, UI_COPY } from '../i18n/translations';
import { SkillId, YouTubeCategory } from '../types/nonoland';
import { soundEngine } from '../utils/soundEngine';

function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '').slice(0, 11);
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    const v = u.searchParams.get('v');
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    const parts = u.pathname.split('/').filter(Boolean);
    const embedIdx = parts.findIndex((p) => p === 'embed' || p === 'shorts');
    if (embedIdx >= 0 && parts[embedIdx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[embedIdx + 1])) {
      return parts[embedIdx + 1];
    }
  } catch {
    return null;
  }
  return null;
}

export const ParentDashboardScreen: React.FC = () => {
  const {
    language,
    activeChild,
    childrenList,
    selectChild,
    updateChildProfile,
    parentSettings,
    updateParentSettings,
    subscription,
    updateSubscription,
    navigate,
    toggleDownloadWorld,
    isOnline,
    simulatedOffline,
    setSimulatedOffline,
    pendingSyncCount,
    syncOfflineQueue,
    resetAllData,
    curatedVideos,
    addCuratedVideo,
    toggleApproveVideo,
    toggleFeatureVideo,
    removeCuratedVideo,
  } = useNonoLand();

  // Parental Gate Math Challenge
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [gateInput, setGateInput] = useState('');
  const [gateError, setGateError] = useState(false);
  const challenge = useMemo(() => ({ a: 7, b: 4, answer: 28 }), []);

  const [tab, setTab] = useState<'reports' | 'profiles' | 'controls' | 'offline' | 'youtube'>('reports');

  // Curated YouTube Form State
  const [ytInput, setYtInput] = useState('');
  const [ytTitleAr, setYtTitleAr] = useState('');
  const [ytTitleEn, setYtTitleEn] = useState('');
  const [ytCategory, setYtCategory] = useState<YouTubeCategory>('stories');
  const [ytError, setYtError] = useState('');
  const [ytApiConfigured, setYtApiConfigured] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/youtube/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setYtApiConfigured(Boolean(data.configured));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(gateInput.trim()) === challenge.answer) {
      soundEngine.playSuccess();
      setGateUnlocked(true);
      setGateError(false);
    } else {
      soundEngine.playEncourage();
      setGateError(true);
    }
  };

  if (!gateUnlocked) {
    return (
      <div className="max-w-md mx-auto my-8 nono-card rounded-3xl p-6 sm:p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#27345C] text-[#FFD84D] flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#27345C]">
            {t(UI_COPY.parent.gateTitle, language)}
          </h1>
          <p className="text-sm text-[#27345C]/75 mt-1">
            {t(UI_COPY.parent.gateSubtitle, language)}
          </p>
        </div>

        <form onSubmit={handleGateSubmit} className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FFF8E9] border border-[#27345C]/12 font-mono-num text-2xl font-extrabold text-[#27345C]">
            {challenge.a} × {challenge.b} = ?
          </div>
          <input
            type="number"
            value={gateInput}
            onChange={(e) => setGateInput(e.target.value)}
            placeholder={language === 'ar' ? 'اكتب الناتج' : 'Enter answer'}
            className="w-full h-12 px-4 rounded-2xl bg-white border-2 border-[#27345C]/15 focus:border-[#8054D9] outline-none text-center font-mono-num text-lg font-bold"
            required
          />
          {gateError && (
            <p className="text-xs font-bold text-[#FF4D6D]">
              {language === 'ar' ? 'حاول مرة أخرى (تلميح: ٢٨)' : 'Try again!'}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('home')}
              className="flex-1 h-12 rounded-2xl bg-slate-100 font-bold text-sm cursor-pointer"
            >
              {language === 'ar' ? 'عودة للطفل' : 'Back'}
            </button>
            <button
              type="submit"
              className="flex-1 nono-btn-tactile h-12 rounded-2xl bg-[#27345C] text-white font-bold text-sm cursor-pointer"
            >
              {language === 'ar' ? 'دخول' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  const insights = generateParentInsights(activeChild);
  const exploredWorldsCount = new Set(activeChild.attempts.map((a) => a.worldId)).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#27345C]">
            {t(UI_COPY.parent.dashboardTitle, language)}
          </h1>
          <p className="text-sm text-[#27345C]/70">
            {language === 'ar'
              ? `عرض تقارير وإعدادات: ${activeChild.displayName}`
              : `Viewing reports & settings for: ${activeChild.displayName}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('home')}
          className="px-4 py-2.5 rounded-xl bg-[#8054D9] text-white text-sm font-bold cursor-pointer"
        >
          {language === 'ar' ? 'العودة لواجهة الطفل' : 'Return to Child World'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-white rounded-2xl border border-[#27345C]/12 w-fit">
        {[
          { id: 'reports' as const, label: UI_COPY.parent.overviewTab, icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'profiles' as const, label: UI_COPY.parent.profilesTab, icon: <Users className="w-4 h-4" /> },
          { id: 'controls' as const, label: UI_COPY.parent.controlsTab, icon: <Volume2 className="w-4 h-4" /> },
          { id: 'offline' as const, label: UI_COPY.parent.offlineTab, icon: <Download className="w-4 h-4" /> },
          { id: 'youtube' as const, label: { ar: 'فيديوهات يوتيوب الآمنة', en: 'Curated YouTube' }, icon: <Film className="w-4 h-4" /> },
        ].map((tb) => (
          <button
            key={tb.id}
            type="button"
            onClick={() => setTab(tb.id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              tab === tb.id ? 'bg-[#27345C] text-white' : 'text-[#27345C]/75 hover:bg-slate-50'
            }`}
          >
            {tb.icon}
            <span>{t(tb.label, language)}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: LEARNING REPORTS & DATA-BACKED INSIGHTS */}
      {tab === 'reports' && (
        <div className="space-y-5">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="nono-card rounded-2xl p-4">
              <p className="text-xs font-bold text-[#27345C]/65">
                {language === 'ar' ? 'الأنشطة المكتملة' : 'Activities Completed'}
              </p>
              <p className="text-3xl font-extrabold text-[#8054D9] mt-1 font-mono-num">
                {formatNumber(activeChild.completedActivityIds.length, language)}
              </p>
            </div>
            <div className="nono-card rounded-2xl p-4">
              <p className="text-xs font-bold text-[#27345C]/65">
                {language === 'ar' ? 'وقت التعلم' : 'Learning Time'}
              </p>
              <p className="text-3xl font-extrabold text-[#39BDF2] mt-1 font-mono-num">
                {formatNumber(activeChild.totalLearningMinutes, language)}m
              </p>
            </div>
            <div className="nono-card rounded-2xl p-4">
              <p className="text-xs font-bold text-[#27345C]/65">
                {language === 'ar' ? 'العوالم المستكشفة' : 'Worlds Explored'}
              </p>
              <p className="text-3xl font-extrabold text-[#55D98B] mt-1 font-mono-num">
                {formatNumber(exploredWorldsCount, language)} / 10
              </p>
            </div>
            <div className="nono-card rounded-2xl p-4">
              <p className="text-xs font-bold text-[#27345C]/65">
                {language === 'ar' ? 'الشهادات والأوسمة' : 'Certificates & Badges'}
              </p>
              <p className="text-3xl font-extrabold text-[#FF9360] mt-1 font-mono-num">
                {activeChild.certificates.length} · {activeChild.unlockedBadges.length}
              </p>
            </div>
          </div>

          {/* Data-Backed Learning Insights + Skill Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 nono-card rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-extrabold text-[#27345C] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#8054D9]" />
                <span>{language === 'ar' ? 'ملخصات التعلم المخصصة' : 'Evidence-Based Learning Insights'}</span>
              </h2>
              <div className="space-y-3">
                {insights.map((ins) => (
                  <div key={ins.id} className="p-3.5 rounded-2xl bg-[#FFF8E9] border border-[#27345C]/10 text-sm font-semibold text-[#27345C]">
                    {t(ins.text, language)}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#27345C]/65 leading-relaxed">
                {t(UI_COPY.parent.noMedicalDisclaimer, language)}
              </p>
            </div>

            <div className="lg:col-span-7 nono-card rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-extrabold text-[#27345C]">
                {language === 'ar' ? 'تقدم المهارات التعليمية' : 'Skill Mastery Breakdown'}
              </h2>
              <div className="space-y-3">
                {(Object.keys(activeChild.skillProgress) as SkillId[]).map((sk) => {
                  const prog = activeChild.skillProgress[sk];
                  const meta = SKILL_LABELS[sk];
                  return (
                    <div key={sk} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{t(meta, language)}</span>
                        <span className="font-mono-num text-[#27345C]/75">
                          {prog.attempts > 0
                            ? `${prog.accuracy}% (${prog.attempts} ${language === 'ar' ? 'محاولات' : 'tries'})`
                            : language === 'ar'
                              ? 'لم يمارس بعد'
                              : 'Not explored yet'}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${prog.attempts > 0 ? Math.max(8, prog.accuracy) : 0}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Assessment History */}
          {activeChild.assessmentHistory.length > 0 && (
            <div className="nono-card rounded-3xl p-6 space-y-3">
              <h2 className="text-lg font-extrabold text-[#27345C]">
                {language === 'ar' ? 'سجل جلسات مختبر الاكتشاف' : 'Discovery Lab Assessment History'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeChild.assessmentHistory.map((h) => (
                  <div key={h.id} className="p-3.5 rounded-2xl bg-[#FFF8E9] border border-[#27345C]/10 text-sm">
                    <p className="font-bold text-[#27345C]">
                      {h.mode === 'baseline'
                        ? language === 'ar'
                          ? 'تقييم البداية'
                          : 'Baseline Assessment'
                        : language === 'ar'
                          ? 'جلسة مختبر نونو'
                          : 'Discovery Lab'}
                    </p>
                    <p className="text-xs text-[#27345C]/70 mt-1 font-mono-num">
                      {h.correctAnswers}/{h.questionsCompleted} · {formatDate(h.date, language)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concept-Level Evidence (Multi-Sensory Mastery) & Offline Parent-Child Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 nono-card rounded-3xl p-6 space-y-3">
              <h2 className="text-lg font-extrabold text-[#27345C] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#8054D9]" />
                <span>
                  {language === 'ar'
                    ? 'سجل إتقان المفاهيم (أكاديمية نونو)'
                    : 'Concept-Level Learning Evidence (Academy)'}
                </span>
              </h2>
              {Object.values(activeChild.conceptMastery || {}).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.values(activeChild.conceptMastery || {})
                    .slice(0, 8)
                    .map((c) => (
                      <div
                        key={c.conceptId}
                        className="p-3 rounded-2xl bg-[#FFF8E9] border border-[#27345C]/10 flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-bold text-sm text-[#27345C]">{t(c.label, language)}</p>
                          <p className="text-[11px] text-[#27345C]/65 font-mono-num">
                            {c.stage} · {c.correctCount}✓ / {c.mistakesCount}↺
                          </p>
                        </div>
                        {c.mistakesCount > c.correctCount && (
                          <span className="text-[11px] font-extrabold text-[#FF9360]">
                            {language === 'ar' ? 'يُقترح مراجعة' : 'Review'}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-[#27345C]/70">
                  {language === 'ar'
                    ? 'عندما يبدأ طفلك بالتدرّب في أكاديمية نونو، ستظهر هنا المفاهيم التي تعرّف عليها وتتبعها وطبقها.'
                    : 'Once your child explores letters, numbers, or colors in Learning Academy, concept-level mastery appears here.'}
                </p>
              )}
            </div>

            <div className="lg:col-span-5 nono-card rounded-3xl p-6 space-y-3">
              <h2 className="text-lg font-extrabold text-[#27345C]">
                {language === 'ar'
                  ? 'أنشطة منزلية مقترحة بين الأهل والطفل'
                  : 'Offline Parent-Child Activities'}
              </h2>
              <div className="space-y-2.5">
                {PARENT_OFFLINE_ACTIVITIES.map((act) => (
                  <div key={act.id} className="p-3.5 rounded-2xl bg-[#E2F9EC]/70 border border-[#55D98B]/40">
                    <p className="font-extrabold text-sm text-[#27345C]">{t(act.title, language)}</p>
                    <p className="text-xs text-[#27345C]/75 mt-1 leading-relaxed">{t(act.desc, language)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHILD PROFILES */}
      {tab === 'profiles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#27345C]">
              {language === 'ar' ? 'ملفات الأطفال في العائلة' : 'Family Child Profiles'}
            </h2>
            <button
              type="button"
              onClick={() => navigate('create-child')}
              className="nono-btn-tactile px-4 py-2.5 rounded-xl bg-[#8054D9] text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t(UI_COPY.createChildProfile, language)}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {childrenList.map((child) => {
              const isSelected = child.id === activeChild.id;
              return (
                <div
                  key={child.id}
                  className={`nono-card rounded-3xl p-5 border-2 ${
                    isSelected ? 'border-[#8054D9]' : 'border-transparent'
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-extrabold text-[#27345C]">{child.displayName}</h3>
                      <p className="text-xs font-bold text-[#8054D9]">
                        {t(AGE_GROUP_META[child.ageGroup].label, language)} ·{' '}
                        {child.language === 'ar' ? 'العربية' : 'English'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectChild(child.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        isSelected ? 'bg-[#55D98B]/25 text-[#27345C]' : 'bg-[#27345C] text-white'
                      }`}
                    >
                      {isSelected
                        ? language === 'ar'
                          ? 'نشط الآن ✓'
                          : 'Active ✓'
                        : language === 'ar'
                          ? 'تبديل'
                          : 'Switch'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-[#27345C]/10">
                    {(['3-4', '5-6', '7', '8'] as const).map((band) => (
                      <button
                        key={band}
                        type="button"
                        onClick={() => updateChildProfile(child.id, { ageGroup: band })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                          child.ageGroup === band
                            ? 'bg-[#8054D9] text-white border-[#8054D9]'
                            : 'bg-white border-[#27345C]/15'
                        }`}
                      >
                        {t(AGE_GROUP_META[band].label, language)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIO, SCREEN TIME & CHILD PRIVACY */}
      {tab === 'controls' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="nono-card rounded-3xl p-6 space-y-5">
            <h2 className="text-xl font-extrabold text-[#27345C] flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-[#8054D9]" />
              <span>{language === 'ar' ? 'إعدادات الصوت والوقت' : 'Audio & Screen Time Controls'}</span>
            </h2>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF8E9] cursor-pointer">
                <span className="font-bold text-sm">
                  {language === 'ar' ? 'كتم جميع الأصوات' : 'Mute All Audio'}
                </span>
                <input
                  type="checkbox"
                  checked={parentSettings.muted}
                  onChange={(e) => updateParentSettings({ muted: e.target.checked })}
                  className="w-5 h-5 accent-[#8054D9]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF8E9] cursor-pointer">
                <span className="font-bold text-sm">
                  {language === 'ar' ? 'القراءة الصوتية للتعليمات والقصص' : 'Voice Narration for Instructions & Stories'}
                </span>
                <input
                  type="checkbox"
                  checked={parentSettings.voiceNarration}
                  onChange={(e) => updateParentSettings({ voiceNarration: e.target.checked })}
                  className="w-5 h-5 accent-[#8054D9]"
                />
              </label>

              <div>
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span>{language === 'ar' ? 'مستوى المؤثرات الصوتية' : 'Sound Effects Volume'}</span>
                  <span className="font-mono-num">{Math.round(parentSettings.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={parentSettings.sfxVolume}
                  onChange={(e) => updateParentSettings({ sfxVolume: Number(e.target.value) })}
                  className="w-full accent-[#8054D9]"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#FF9360]" />
                    {language === 'ar' ? 'الحد اليومي المقترح للشاشة' : 'Daily Screen-Time Preference'}
                  </span>
                  <span className="font-mono-num">{parentSettings.dailyScreenTimeMinutes} min</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={90}
                  step={15}
                  value={parentSettings.dailyScreenTimeMinutes}
                  onChange={(e) =>
                    updateParentSettings({ dailyScreenTimeMinutes: Number(e.target.value) })
                  }
                  className="w-full accent-[#FF9360]"
                />
              </div>
            </div>
          </div>

          <div className="nono-card rounded-3xl p-6 space-y-4">
            <h2 className="text-xl font-extrabold text-[#27345C] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#55D98B]" />
              <span>{language === 'ar' ? 'أمان الطفل والخصوصية' : 'Child Safety & Privacy Controls'}</span>
            </h2>
            <ul className="space-y-2.5 text-sm text-[#27345C]/80">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#55D98B] shrink-0" />
                <span>
                  {language === 'ar'
                    ? 'لا توجد ملفات عامة للأطفال ولا محادثات مفتوحة مع غرباء.'
                    : 'No public child profiles, no open chat, and zero stranger interaction.'}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#55D98B] shrink-0" />
                <span>
                  {language === 'ar'
                    ? 'لا يتم طلب الميكروفون أو الكاميرا لاستخدام التطبيق.'
                    : 'Microphone and camera permissions are never required for normal play.'}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#55D98B] shrink-0" />
                <span>
                  {language === 'ar'
                    ? 'يُحفظ التقدم حالياً محلياً على جهازك؛ يمكن ربط Firebase/Backend لاحقاً.'
                    : 'Progress persists locally on this device; cloud auth/database requires backend credential setup.'}
                </span>
              </li>
            </ul>

            <div className="pt-4 border-t border-[#27345C]/10">
              <button
                type="button"
                onClick={resetAllData}
                className="px-4 py-2 rounded-xl bg-[#FF4D6D]/12 text-[#FF4D6D] text-xs font-extrabold cursor-pointer hover:bg-[#FF4D6D]/20"
              >
                {language === 'ar' ? 'إعادة ضبط البيانات التجريبية' : 'Reset Local Demo Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OFFLINE CONTENT & FREEMIUM SUBSCRIPTION */}
      {tab === 'offline' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="nono-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-[#27345C] flex items-center gap-2">
                {isOnline ? <Wifi className="w-5 h-5 text-[#55D98B]" /> : <WifiOff className="w-5 h-5 text-[#FF9360]" />}
                <span>{language === 'ar' ? 'المحتوى المحمّل والمزامنة' : 'Downloaded Worlds & Offline Sync'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setSimulatedOffline(!simulatedOffline)}
                className="px-3 py-1.5 rounded-xl bg-[#FFF8E9] border border-[#27345C]/15 text-xs font-bold cursor-pointer"
              >
                {simulatedOffline
                  ? language === 'ar'
                    ? 'استعادة الاتصال'
                    : 'Go Online'
                  : language === 'ar'
                    ? 'تجربة وضع عدم الاتصال'
                    : 'Test Offline Mode'}
              </button>
            </div>

            {pendingSyncCount > 0 && (
              <div className="p-3 rounded-2xl bg-[#FFD84D]/25 flex items-center justify-between text-xs font-bold">
                <span>
                  {language === 'ar'
                    ? `يوجد ${pendingSyncCount} نشاط بانتظار المزامنة`
                    : `${pendingSyncCount} queued attempt(s) awaiting sync`}
                </span>
                {isOnline && (
                  <button
                    type="button"
                    onClick={syncOfflineQueue}
                    className="px-3 py-1 rounded-lg bg-[#27345C] text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{language === 'ar' ? 'مزامنة الآن' : 'Sync Now'}</span>
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {LEARNING_WORLDS.map((w) => {
                const downloaded = activeChild.downloadedWorldIds.includes(w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => toggleDownloadWorld(w.id)}
                    className={`p-3 rounded-2xl border text-start flex items-center justify-between gap-2 cursor-pointer ${
                      downloaded ? 'bg-[#55D98B]/15 border-[#55D98B]' : 'bg-white border-[#27345C]/12'
                    }`}
                  >
                    <span className="text-xs font-bold text-[#27345C] truncate">
                      {w.guardianEmoji} {t(w.name, language)}
                    </span>
                    <span className="text-[11px] font-extrabold shrink-0">
                      {downloaded ? '✓' : '+'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Freemium Subscription Screen (Parent-Controlled) */}
          <div className="nono-card rounded-3xl p-6 space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#27345C]">
                {language === 'ar' ? 'باقات نونو لاند (تحكم الأهل فقط)' : 'NonoLand Plans (Parent-Controlled)'}
              </h2>
              <p className="text-xs text-[#27345C]/70 mt-1">
                {language === 'ar'
                  ? 'المحتوى الأساسي متاح مجاناً دائماً. واجهة الباقات هنا للمعاينة بدون بوابة دفع مفعّلة.'
                  : 'Core learning worlds are free. Billing gateway is not connected in this preview environment.'}
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 'free' as const, ar: 'الباقة المجانية — استكشاف العوالم الأساسية', en: 'Free — Core 10 Worlds & Activities' },
                { id: 'monthly' as const, ar: 'الاشتراك الشهري — قصص ومسارات متقدمة', en: 'Monthly — Extended Stories & Paths' },
                { id: 'quarterly' as const, ar: 'الاشتراك ربع السنوي — تقارير موسعة', en: 'Quarterly — Extended Family Reports' },
                { id: 'annual' as const, ar: 'الاشتراك السنوي — التجربة العائلية الكاملة', en: 'Annual — Full Family Universe' },
              ].map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => updateSubscription(plan.id)}
                  className={`w-full p-3.5 rounded-2xl border-2 text-start flex items-center justify-between cursor-pointer ${
                    subscription.tier === plan.id
                      ? 'border-[#8054D9] bg-[#8054D9]/10'
                      : 'border-[#27345C]/10 bg-white'
                  }`}
                >
                  <span className="font-bold text-sm text-[#27345C]">
                    {language === 'ar' ? plan.ar : plan.en}
                  </span>
                  {subscription.tier === plan.id && <Check className="w-4 h-4 text-[#8054D9]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CURATED YOUTUBE & CONTENT MANAGER (@Future-p6l) */}
      {tab === 'youtube' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 nono-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-[#27345C] flex items-center gap-2">
                <Film className="w-5 h-5 text-[#FF4D6D]" />
                <span>{language === 'ar' ? 'إضافة فيديو معتمد' : 'Add Verified YouTube Video'}</span>
              </h2>
              <a
                href={OFFICIAL_YOUTUBE_CHANNEL.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#8054D9] flex items-center gap-1 hover:underline"
              >
                <span>@Future-p6l</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-3 rounded-2xl bg-[#FFF8E9] border border-[#27345C]/10 text-xs text-[#27345C]/80">
              {ytApiConfigured
                ? language === 'ar'
                  ? 'حالة الخادم: YOUTUBE_API_KEY مفعّل — يتم جلب المقاطع الرسمية وتظهر في منطقة المرح.'
                  : 'Server status: YOUTUBE_API_KEY is configured and fetching official uploads.'
                : language === 'ar'
                  ? 'حالة الخادم: YOUTUBE_API_KEY غير مضبوط. يمكنك إضافة روابط أو معرّفات الفيديوهات الحقيقية يدوياً هنا لتظهر لطفلك بأمان.'
                  : 'Server status: YOUTUBE_API_KEY is not set. Add verified video URLs or IDs manually below to publish them safely to your child.'}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const parsedId = extractYouTubeId(ytInput);
                if (!parsedId) {
                  setYtError(
                    language === 'ar'
                      ? 'يرجى إدخال رابط يوتيوب صحيح أو معرّف فيديو مكوّن من ١١ حرفاً.'
                      : 'Please enter a valid YouTube URL or 11-character Video ID.',
                  );
                  return;
                }
                addCuratedVideo({
                  videoId: parsedId,
                  title: {
                    ar: ytTitleAr.trim() || ytTitleEn.trim() || 'فيديو نونو لاند',
                    en: ytTitleEn.trim() || ytTitleAr.trim() || 'NonoLand Video',
                  },
                  category: ytCategory,
                  ageGroups: ['3-4', '5-6', '7', '8'],
                  approvedByParent: true,
                  featured: false,
                });
                soundEngine.playSuccess();
                setYtInput('');
                setYtTitleAr('');
                setYtTitleEn('');
                setYtError('');
              }}
              className="space-y-3"
            >
              <input
                type="text"
                value={ytInput}
                onChange={(e) => setYtInput(e.target.value)}
                placeholder={language === 'ar' ? 'رابط الفيديو أو Video ID (11 حرفاً)' : 'YouTube URL or 11-char Video ID'}
                className="w-full h-11 px-3.5 rounded-xl bg-white border-2 border-[#27345C]/15 text-sm"
                required
              />
              <input
                type="text"
                value={ytTitleAr}
                onChange={(e) => setYtTitleAr(e.target.value)}
                placeholder={language === 'ar' ? 'عنوان الفيديو بالعربية' : 'Arabic Title'}
                className="w-full h-11 px-3.5 rounded-xl bg-white border-2 border-[#27345C]/15 text-sm"
              />
              <input
                type="text"
                value={ytTitleEn}
                onChange={(e) => setYtTitleEn(e.target.value)}
                placeholder={language === 'ar' ? 'عنوان الفيديو بالإنجليزية' : 'English Title'}
                className="w-full h-11 px-3.5 rounded-xl bg-white border-2 border-[#27345C]/15 text-sm"
              />
              <select
                value={ytCategory}
                onChange={(e) => setYtCategory(e.target.value as YouTubeCategory)}
                className="w-full h-11 px-3.5 rounded-xl bg-white border-2 border-[#27345C]/15 text-sm font-bold"
              >
                <option value="stories">{language === 'ar' ? 'قصص' : 'Stories'}</option>
                <option value="cartoons">{language === 'ar' ? 'رسوم تعليمية' : 'Educational Cartoons'}</option>
                <option value="songs">{language === 'ar' ? 'أغاني أصلية' : 'Original Songs'}</option>
                <option value="adventures">{language === 'ar' ? 'مغامرات' : 'Adventures'}</option>
              </select>
              {ytError && <p className="text-xs font-bold text-[#FF4D6D]">{ytError}</p>}
              <button
                type="submit"
                className="w-full nono-btn-tactile h-11 rounded-xl bg-[#8054D9] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ar' ? 'إضافة واعتماد الفيديو' : 'Add & Approve Video'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 nono-card rounded-3xl p-6 space-y-4">
            <h2 className="text-xl font-extrabold text-[#27345C]">
              {language === 'ar' ? 'قائمة الفيديوهات المعتمدة للأطفال' : 'Curated Child-Safe Video List'}
            </h2>
            {curatedVideos.length === 0 ? (
              <p className="text-sm text-[#27345C]/70">
                {language === 'ar'
                  ? 'لا توجد فيديوهات مضافة يدوياً بعد. أضف رابط فيديو من قناة نونو لاند الرسمية ليظهر في منطقة المرح.'
                  : 'No manually curated videos yet. Add a verified video link on the left to publish it inside Nono’s Fun Zone.'}
              </p>
            ) : (
              <div className="space-y-3">
                {curatedVideos.map((vid) => (
                  <div
                    key={vid.id}
                    className="p-3.5 rounded-2xl bg-[#FFF8E9] border border-[#27345C]/12 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-extrabold text-sm text-[#27345C]">{t(vid.title, language)}</p>
                      <p className="text-xs text-[#27345C]/65 font-mono-num">
                        ID: {vid.videoId} · {vid.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleApproveVideo(vid.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                          vid.approvedByParent ? 'bg-[#55D98B] text-[#27345C]' : 'bg-slate-200 text-[#27345C]/70'
                        }`}
                      >
                        {vid.approvedByParent
                          ? language === 'ar'
                            ? 'معتمد ✓'
                            : 'Approved ✓'
                          : language === 'ar'
                            ? 'مخفي'
                            : 'Hidden'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFeatureVideo(vid.id)}
                        aria-label="Toggle featured"
                        className={`p-2 rounded-xl cursor-pointer ${
                          vid.featured ? 'bg-[#FFD84D] text-[#27345C]' : 'bg-white border border-slate-200'
                        }`}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCuratedVideo(vid.id)}
                        aria-label="Remove video"
                        className="p-2 rounded-xl bg-[#FF4D6D]/12 text-[#FF4D6D] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
