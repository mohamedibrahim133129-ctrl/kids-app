import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Languages,
  Lock,
  Plus,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import nonoHeroImg from '../assets/images/nono_companion_hero_1794739847988.jpg';
import { NonoCharacter } from '../components/NonoCharacter';
import { useNonoLand } from '../context/NonoLandContext';
import { CHARACTER_COMPANIONS } from '../data/rewardsAndRoom';
import { AGE_GROUP_META, t, UI_COPY } from '../i18n/translations';
import { AgeGroupId, Language } from '../types/nonoland';
import { soundEngine } from '../utils/soundEngine';

export const SplashScreen: React.FC = () => {
  const { navigate, language, setLanguage, childrenList, selectChild } = useNonoLand();
  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#27345C] via-[#4C348F] to-[#8054D9] text-white flex flex-col justify-between p-5 sm:p-8">
      {/* Animated starry sky backdrop */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-12 start-12 w-3 h-3 rounded-full bg-[#FFD84D] animate-twinkle" />
        <div className="absolute top-28 end-20 w-4 h-4 rounded-full bg-[#39BDF2] animate-twinkle" style={{ animationDelay: '-1s' }} />
        <div className="absolute bottom-36 start-1/4 w-2.5 h-2.5 rounded-full bg-[#FF78B7] animate-twinkle" style={{ animationDelay: '-2s' }} />
        <div className="absolute -bottom-24 -start-24 w-96 h-96 rounded-full bg-[#39BDF2]/20 blur-3xl" />
        <div className="absolute -top-24 -end-24 w-96 h-96 rounded-full bg-[#FF78B7]/20 blur-3xl" />
      </div>

      {/* Top row: Brand & Language */}
      <div className="relative z-10 max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FFD84D] text-[#27345C] flex items-center justify-center text-2xl shadow-lg">
            🦊
          </div>
          <span className="text-2xl font-extrabold tracking-tight">{t(UI_COPY.appName, language)}</span>
        </div>
        <button
          type="button"
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="h-11 px-4 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Languages className="w-4 h-4 text-[#FFD84D]" />
          <span>{language === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      {/* Hero Centerpiece */}
      <div className="relative z-10 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-7 space-y-5 text-center lg:text-start"
        >
          <p className="text-sm sm:text-base font-bold text-[#FFD84D]">
            {language === 'ar'
              ? 'عالم تعليمي تفاعلي مخصص للأعمار من ٣ إلى ٨ سنوات'
              : 'Personalized Interactive Educational Universe · Ages 3 to 8'}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-balance">
            {language === 'ar'
              ? 'لكل طفل عالمه السحري ومغامرته المختلفة'
              : 'Every Child. A Different World. A Unique Adventure.'}
          </h1>
          <p className="text-base sm:text-lg text-white/85 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            {language === 'ar'
              ? 'نونو يرحب بطفلك، يتكيّف مع عمره وقدراته، ويأخذه في رحلة بين ١٠ عوالم تعليمية، قصص تفاعلية، مختبر اكتشاف ذكي، وغرفة يزينها بإنجازاته.'
              : 'Nono greets your child by name, adapts to their developmental stage, and unlocks 10 interactive worlds, branching stories, a playful Discovery Lab, and their own customizable room.'}
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSuccess();
                navigate('home');
              }}
              className="nono-btn-tactile h-14 px-7 rounded-2xl bg-[#FFD84D] text-[#27345C] text-lg font-extrabold flex items-center gap-2.5 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span>{t(UI_COPY.startAdventure, language)}</span>
              <ArrowIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => navigate('onboarding')}
              className="h-14 px-6 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Compass className="w-5 h-5 text-[#39BDF2]" />
              <span>{language === 'ar' ? 'جولة التعريف وإعداد طفل جديد' : 'Guided Onboarding & New Child'}</span>
            </button>
          </div>

          {/* Quick Age Profile Launcher */}
          <div className="pt-4">
            <p className="text-xs font-bold text-white/75 mb-2.5">
              {language === 'ar'
                ? 'أو جرّب فوراً تجربة عمرية جاهزة:'
                : 'Or jump straight into any age-band experience:'}
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              {childrenList.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => {
                    selectChild(child.id);
                    navigate('home');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/12 hover:bg-white/25 border border-white/20 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>{child.displayName}</span>
                  <span className="text-[#FFD84D]">· {t(AGE_GROUP_META[child.ageGroup].label, language)}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-5 flex justify-center"
        >
          <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-[2.5rem] p-3 bg-white/15 border-2 border-white/30 shadow-2xl animate-float-slow">
            <img
              src={nonoHeroImg}
              alt={language === 'ar' ? 'نونو صديق الأطفال في نونو لاند' : 'Nono the cosmic star-fox companion'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-[2rem]"
            />
          </div>
        </motion.div>
      </div>

      {/* Footer note */}
      <div className="relative z-10 max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-white/70">
        <span>{language === 'ar' ? 'مساحة آمنة للأطفال · بدون إعلانات أو محادثات مفتوحة' : 'Child-Safe Space · Zero Ads · Parent-Gated Controls'}</span>
        <button
          type="button"
          onClick={() => navigate('parent-auth')}
          className="hover:text-white underline cursor-pointer flex items-center gap-1"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'دخول / تسجيل الأهل' : 'Parent Sign In / Register'}</span>
        </button>
      </div>
    </div>
  );
};

export const OnboardingScreen: React.FC = () => {
  const { navigate, language } = useNonoLand();
  const [step, setStep] = useState(0);

  const slides = [
    {
      emoji: '🦊✨',
      title: { ar: 'أربع تجارب تعلم مختلفة حسب العمر', en: 'Four Distinct Age-Tailored Worlds' },
      body: {
        ar: 'طفل الـ ٣ سنوات يلعب بالصوت واللمس بدون قراءة، وطفل الـ ٥–٦ يتعلم الحروف والأرقام، بينما يحل أبطال ٧–٨ سنوات ألغاز المنطق والعلوم والكسور.',
        en: 'Ages 3–4 explore via voice & touch, 5–6 master letters & patterns, 7-year-olds become detectives, and 8-year-olds tackle fractions, grammar & science.',
      },
      color: 'from-[#8054D9]/15 to-[#FF78B7]/15',
    },
    {
      emoji: '🧭🔬',
      title: { ar: 'مسار ذكي يتكيف مع طفلك', en: 'Adaptive Learning That Adapts to Your Child' },
      body: {
        ar: 'مختبر نونو للاكتشاف يلاحظ المهارات القوية والمهارات التي تحتاج لتدريب لطيف، ويقترح الخطوة التالية دون أي مقارنة أو ضغط.',
        en: "Nono's Discovery Lab observes strengths and gentle practice areas, tailoring the next adventure with zero exam stress.",
      },
      color: 'from-[#39BDF2]/15 to-[#55D98B]/15',
    },
    {
      emoji: '🛡️🏆',
      title: { ar: 'أمان تام، غرف إبداعية، وشهادات', en: 'Parent-Gated Safety, My Room & Certificates' },
      body: {
        ar: 'لا إعلانات ولا تواصل مع غرباء. يحصل الطفل على نجوم وأوسمة وشهادات قابلة للطباعة، ويزيّن غرفته الخاصة بإنجازاته.',
        en: 'Zero ads or public profiles. Children decorate My Room with earned rewards and unlock printable world certificates.',
      },
      color: 'from-[#FFD84D]/25 to-[#FF9360]/15',
    },
  ];

  const current = slides[step];

  return (
    <div className="min-h-screen bg-[#FFF8E9] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl nono-card rounded-3xl p-6 sm:p-10 text-center">
        <div className={`rounded-3xl bg-gradient-to-br ${current.color} p-8 mb-6`}>
          <div className="text-6xl mb-4">{current.emoji}</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#27345C] text-balance">
            {t(current.title, language)}
          </h2>
          <p className="text-[#27345C]/80 mt-3 text-base sm:text-lg leading-relaxed">
            {t(current.body, language)}
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setStep(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-3 rounded-full transition-all cursor-pointer ${
                idx === step ? 'w-10 bg-[#8054D9]' : 'w-3 bg-[#27345C]/20'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('splash')}
            className="px-4 py-3 rounded-2xl text-sm font-bold text-[#27345C]/70 hover:text-[#27345C] cursor-pointer"
          >
            {language === 'ar' ? 'رجوع' : 'Back'}
          </button>

          {step < slides.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                setStep(step + 1);
              }}
              className="nono-btn-tactile px-7 py-3 rounded-2xl bg-[#8054D9] text-white font-bold cursor-pointer"
            >
              {language === 'ar' ? 'التالي' : 'Next'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('parent-auth')}
              className="nono-btn-tactile px-7 py-3 rounded-2xl bg-[#55D98B] text-[#27345C] font-extrabold cursor-pointer"
            >
              {language === 'ar' ? 'متابعة لإعداد الحساب' : 'Continue to Family Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const ParentAuthScreen: React.FC = () => {
  const { navigate, language, parentAccount, setParentAccount } = useNonoLand();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [name, setName] = useState(parentAccount?.name || '');
  const [email, setEmail] = useState(parentAccount?.email || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playSuccess();
    setParentAccount({
      id: `parent-${Date.now()}`,
      name: name.trim() || (language === 'ar' ? 'ولي الأمر' : 'Parent'),
      email: email.trim() || 'parent@nonoland.local',
      createdAt: new Date().toISOString(),
      isDemoMode: true,
    });
    navigate('create-child');
  };

  return (
    <div className="min-h-screen bg-[#FFF8E9] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg nono-card rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-[#27345C] text-[#FFD84D] flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-[#27345C]">
                {mode === 'register'
                  ? language === 'ar'
                    ? 'إنشاء حساب الأهل'
                    : 'Parent Registration'
                  : language === 'ar'
                    ? 'تسجيل دخول الأهل'
                    : 'Parent Login'}
              </h2>
              <p className="text-xs text-[#27345C]/65">
                {language === 'ar' ? 'حفظ محلي آمن على جهازك (بدون جمع بيانات زائدة)' : 'Saved locally with minimal data collection'}
              </p>
            </div>
          </div>
          <div className="flex gap-1 bg-[#27345C]/8 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                mode === 'register' ? 'bg-white text-[#27345C] shadow-sm' : 'text-[#27345C]/65'
              }`}
            >
              {language === 'ar' ? 'جديد' : 'Register'}
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                mode === 'login' ? 'bg-white text-[#27345C] shadow-sm' : 'text-[#27345C]/65'
              }`}
            >
              {language === 'ar' ? 'دخول' : 'Login'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-bold mb-1.5">
                {language === 'ar' ? 'اسم ولي الأمر' : 'Parent Display Name'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: أم عمر / أحمد' : 'e.g. Sarah'}
                className="w-full h-12 px-4 rounded-2xl bg-[#FFF8E9] border-2 border-[#27345C]/12 focus:border-[#8054D9] outline-none font-semibold"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold mb-1.5">
              {language === 'ar' ? 'البريد الإلكتروني للعائلة' : 'Family Email'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="family@example.com"
              className="w-full h-12 px-4 rounded-2xl bg-[#FFF8E9] border-2 border-[#27345C]/12 focus:border-[#8054D9] outline-none font-semibold"
            />
          </div>

          <button
            type="submit"
            className="w-full nono-btn-tactile h-13 rounded-2xl bg-[#8054D9] text-white font-extrabold text-base cursor-pointer"
          >
            {language === 'ar' ? 'متابعة لإضافة ملف الطفل' : 'Continue to Create Child Profile'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#27345C]/10 flex items-center justify-between text-xs text-[#27345C]/70">
          <button type="button" onClick={() => navigate('home')} className="underline cursor-pointer">
            {language === 'ar' ? 'الدخول السريع بالحساب التجريبي' : 'Skip & Explore with Sample Family'}
          </button>
          <button type="button" onClick={() => navigate('splash')} className="cursor-pointer">
            {language === 'ar' ? 'الرئيسية' : 'Back'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const CreateChildScreen: React.FC = () => {
  const { navigate, language, createChildProfile } = useNonoLand();
  const [displayName, setDisplayName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroupId>('5-6');
  const [childLang, setChildLang] = useState<Language>(language);
  const [birthYear, setBirthYear] = useState(2021);
  const [birthMonth, setBirthMonth] = useState(5);
  const [interests, setInterests] = useState<string[]>(['animals', 'space']);
  const [companionId, setCompanionId] = useState('nono');
  const [scarfColor, setScarfColor] = useState('#8054D9');

  const interestOptions = [
    { id: 'animals', ar: 'الحيوانات 🦁', en: 'Animals 🦁' },
    { id: 'space', ar: 'الفضاء والعلوم 🚀', en: 'Space & Science 🚀' },
    { id: 'letters', ar: 'الحروف والقصص 📖', en: 'Letters & Stories 📖' },
    { id: 'math', ar: 'الأرقام والألغاز 🔢', en: 'Numbers & Puzzles 🔢' },
    { id: 'art', ar: 'الرسم والموسيقى 🎨', en: 'Art & Music 🎨' },
  ];

  const scarfColors = ['#8054D9', '#39BDF2', '#FF78B7', '#55D98B', '#FF9360'];

  const toggleInterest = (id: string) => {
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playSuccess();
    createChildProfile({
      displayName: displayName.trim() || (childLang === 'ar' ? 'بطل نونو' : 'Little Explorer'),
      ageGroup,
      language: childLang,
      birthYear,
      birthMonth,
      interests,
      companionId,
      companionScarfColor: scarfColor,
    });
    navigate('child-welcome');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E5F6FF] to-[#FFF8E9] py-8 px-4">
      <div className="max-w-3xl mx-auto nono-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#27345C]">
              {t(UI_COPY.createChildProfile, language)}
            </h2>
            <p className="text-sm text-[#27345C]/70">
              {language === 'ar'
                ? 'نجمع الاسم المستعار والعمر فقط لنصمم تجربة تناسب طفلك بأمان'
                : 'We only collect a display name and age band to personalize their safe adventure'}
            </p>
          </div>
          <NonoCharacter mood="waving" scarfColor={scarfColor} size="sm" interactive={false} />
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Name & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1.5">
                {language === 'ar' ? 'اسم الطفل (المستعار)' : "Child's Display Name"}
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: كريم أو مريم' : 'e.g. Adam or Maya'}
                className="w-full h-12 px-4 rounded-2xl bg-[#FFF8E9] border-2 border-[#27345C]/12 focus:border-[#8054D9] outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5">
                {language === 'ar' ? 'اللغة المفضلة للطفل' : 'Preferred Language'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['ar', 'en'] as Language[]).map((lng) => (
                  <button
                    key={lng}
                    type="button"
                    onClick={() => setChildLang(lng)}
                    className={`h-12 rounded-2xl font-bold border-2 cursor-pointer transition-colors ${
                      childLang === lng
                        ? 'bg-[#8054D9] text-white border-[#8054D9]'
                        : 'bg-white text-[#27345C] border-[#27345C]/12'
                    }`}
                  >
                    {lng === 'ar' ? 'العربية (أساسي)' : 'English'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Age Band Selection */}
          <div>
            <label className="block text-sm font-bold mb-2">
              {language === 'ar' ? 'اختر الفئة العمرية (تغيّر التجربة بالكامل)' : 'Select Age Band (Tailors Entire Experience)'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['3-4', '5-6', '7', '8'] as AgeGroupId[]).map((band) => {
                const meta = AGE_GROUP_META[band];
                const selected = ageGroup === band;
                return (
                  <button
                    key={band}
                    type="button"
                    onClick={() => {
                      soundEngine.playPop();
                      setAgeGroup(band);
                      setBirthYear(band === '3-4' ? 2023 : band === '5-6' ? 2021 : band === '7' ? 2019 : 2018);
                    }}
                    className={`p-4 rounded-2xl border-2 text-start transition-all cursor-pointer ${
                      selected
                        ? 'bg-white border-[#8054D9] shadow-md'
                        : 'bg-[#FFF8E9]/60 border-[#27345C]/10 hover:border-[#27345C]/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-base" style={{ color: meta.color }}>
                        {t(meta.label, language)}
                      </span>
                      {selected && <Check className="w-5 h-5 text-[#8054D9]" />}
                    </div>
                    <p className="font-bold text-sm text-[#27345C] mt-1">{t(meta.badgeTitle, language)}</p>
                    <p className="text-xs text-[#27345C]/70 mt-1">{t(meta.description, language)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Birth Month/Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1 text-[#27345C]/70">
                {language === 'ar' ? 'سنة الميلاد' : 'Birth Year'}
              </label>
              <input
                type="number"
                min={2017}
                max={2024}
                value={birthYear}
                onChange={(e) => setBirthYear(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl bg-[#FFF8E9] border border-[#27345C]/15 font-mono-num font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-[#27345C]/70">
                {language === 'ar' ? 'شهر الميلاد' : 'Birth Month'}
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={birthMonth}
                onChange={(e) => setBirthMonth(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl bg-[#FFF8E9] border border-[#27345C]/15 font-mono-num font-bold"
              />
            </div>
          </div>

          {/* Interests & Companion Color */}
          <div>
            <label className="block text-sm font-bold mb-2">
              {language === 'ar' ? 'اهتمامات الطفل (اختياري)' : 'Child Interests (Optional)'}
            </label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((opt) => {
                const active = interests.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleInterest(opt.id)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-bold border cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#FFD84D]/40 border-[#FF9360] text-[#27345C]'
                        : 'bg-white border-[#27345C]/12 text-[#27345C]/70'
                    }`}
                  >
                    {language === 'ar' ? opt.ar : opt.en}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-sm font-bold mb-2">
                {language === 'ar' ? 'اختر الرفيق المفضل' : 'Favorite Companion'}
              </label>
              <div className="flex gap-2">
                {CHARACTER_COMPANIONS.slice(0, 4).map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setCompanionId(ch.id)}
                    className={`flex-1 py-2.5 rounded-2xl border-2 text-center cursor-pointer ${
                      companionId === ch.id ? 'border-[#8054D9] bg-[#8054D9]/10' : 'border-[#27345C]/10 bg-white'
                    }`}
                  >
                    <div className="text-2xl">{ch.emoji}</div>
                    <div className="text-xs font-bold mt-0.5">{t(ch.name, language)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                {language === 'ar' ? 'لون وشاح نونو' : "Nono's Scarf Color"}
              </label>
              <div className="flex gap-3">
                {scarfColors.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setScarfColor(col)}
                    aria-label={col}
                    className={`w-10 h-10 rounded-full border-4 cursor-pointer transition-transform ${
                      scarfColor === col ? 'border-[#27345C] scale-110' : 'border-white'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3">
            <button
              type="button"
              onClick={() => navigate('home')}
              className="px-4 py-3 rounded-2xl text-sm font-bold text-[#27345C]/70 hover:text-[#27345C] cursor-pointer"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="nono-btn-tactile h-13 px-8 rounded-2xl bg-[#8054D9] text-white font-extrabold flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>{language === 'ar' ? 'ابدأ رحلة الطفل!' : "Launch Child's World!"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ChildWelcomeScreen: React.FC = () => {
  const { activeChild, language, navigate } = useNonoLand();
  const greeting =
    language === 'ar'
      ? `أهلاً يا ${activeChild.displayName}! أنا نونو، هيا نلعب لعبة استكشاف صغيرة لنعرف ما تحبه!`
      : `Welcome, ${activeChild.displayName}! I'm Nono — let's play a quick discovery game to tailor your world!`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#39BDF2]/20 via-[#FFF8E9] to-[#FFD84D]/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full nono-card rounded-3xl p-8 text-center space-y-6"
      >
        <NonoCharacter
          mood="excited"
          scarfColor={activeChild.companionScarfColor}
          size="lg"
          speechBubble={greeting}
          language={language}
        />

        <div>
          <h1 className="text-3xl font-extrabold text-[#27345C]">
            {language === 'ar' ? `مرحباً ${activeChild.displayName} في نونو لاند!` : `Welcome to NonoLand, ${activeChild.displayName}!`}
          </h1>
          <p className="text-[#27345C]/75 mt-2">
            {t(AGE_GROUP_META[activeChild.ageGroup].badgeTitle, language)} · {t(AGE_GROUP_META[activeChild.ageGroup].label, language)}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigate('baseline-assessment')}
            className="flex-1 nono-btn-tactile h-14 rounded-2xl bg-[#8054D9] text-white font-extrabold text-base flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            <span>{language === 'ar' ? 'ابدأ رحلة الاكتشاف الأولى' : 'Play Baseline Discovery'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('home')}
            className="h-14 px-5 rounded-2xl bg-white border-2 border-[#27345C]/15 font-bold text-[#27345C] cursor-pointer"
          >
            {language === 'ar' ? 'الدخول للرئيسية مباشرة' : 'Go to Home'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
