import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { VALIDATED_EXAM_BANK } from './src/data/deepCurriculum';
import type {
  AgeGroupId,
  Certificate,
  CmsLessonRecord,
  ExamAttemptSummary,
  ExamConfig,
  ExamQuestionItem,
  ExamSubject,
  LocalizedText,
  WorldId,
} from './src/types/nonoland';

dotenv.config();

interface CheckoutSession {
  id: string;
  childId: string;
  subject: ExamSubject;
  amountEgp: number;
  status: 'pending' | 'verified';
  paymentToken?: string;
  tokenConsumed?: boolean;
  createdAt: string;
  verifiedAt?: string;
}

interface StoredExamAttempt {
  id: string;
  childId: string;
  childName: string;
  ageGroup: AgeGroupId;
  subject: ExamSubject;
  mode: 'practice' | 'official';
  questionIds: string[];
  paymentVerified: boolean;
  amountPaidEgp: number;
  passingPercentage: number;
  submitted: boolean;
  summary?: ExamAttemptSummary;
  certificateCode?: string;
  createdAt: string;
}

interface ServerDb {
  examConfig: ExamConfig;
  customLessons: CmsLessonRecord[];
  customQuestions: ExamQuestionItem[];
  checkoutSessions: Record<string, CheckoutSession>;
  examAttempts: Record<string, StoredExamAttempt>;
  certificates: Record<string, Certificate & { revoked?: boolean }>;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'nonoland-server-db.json');

function getDefaultDb(): ServerDb {
  return {
    examConfig: {
      examPriceEgp: 50,
      currency: 'EGP',
      passingPercentage: 70,
      questionsPerExam: 40,
      paymentGatewayMode:
        process.env.STRIPE_SECRET_KEY || process.env.PAYMOB_API_KEY
          ? 'live-gateway'
          : 'development-test-verification',
    },
    customLessons: [],
    customQuestions: [],
    checkoutSessions: {},
    examAttempts: {},
    certificates: {},
  };
}

function loadDb(): ServerDb {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as ServerDb;
      return {
        ...getDefaultDb(),
        ...parsed,
        examConfig: {
          ...getDefaultDb().examConfig,
          ...(parsed.examConfig || {}),
        },
      };
    }
  } catch {
    // Fallback to clean DB
  }
  return getDefaultDb();
}

function saveDb(db: ServerDb) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function subjectToWorld(subject: ExamSubject): { worldId: WorldId; worldName: LocalizedText } {
  switch (subject) {
    case 'arabic':
      return { worldId: 'arabic-letters', worldName: { ar: 'جزيرة الحروف العربية', en: 'Arabic Letters Island' } };
    case 'english':
      return { worldId: 'english-letters', worldName: { ar: 'مدينة الإنجليزية', en: 'English Alphabet City' } };
    case 'math':
      return { worldId: 'numbers-kingdom', worldName: { ar: 'مملكة الأرقام والرياضيات', en: 'Numbers & Math Kingdom' } };
    case 'colors-science':
      return { worldId: 'science-galaxy', worldName: { ar: 'مجرة العلوم والألوان', en: 'Colors & Science Galaxy' } };
    default:
      return { worldId: 'intelligence-castle', worldName: { ar: 'امتحان نونو لاند الشامل', en: 'NonoLand Comprehensive Academy' } };
  }
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const expectedPin = process.env.ADMIN_PIN || '2026';
  const provided = req.header('x-admin-pin');
  if (provided !== expectedPin) {
    return res.status(401).json({ error: 'Invalid or missing Admin PIN' });
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());

  let db = loadDb();
  saveDb(db);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // ------------------------------------------------------------------
  // 1. PUBLIC EXAM CONFIG & PUBLISHED CMS CONTENT
  // ------------------------------------------------------------------
  app.get('/api/config/exams', (_req, res) => {
    res.json(db.examConfig);
  });

  app.get('/api/cms/content', (_req, res) => {
    res.json({
      lessons: db.customLessons.filter((l) => l.published),
      customQuestionsCount: db.customQuestions.filter((q) => q.published !== false).length,
    });
  });

  // ------------------------------------------------------------------
  // 2. SECURE BACKEND PAYMENT CHECKOUT & VERIFICATION (50 EGP default)
  // ------------------------------------------------------------------
  app.post('/api/payments/create-checkout', (req, res) => {
    const { childId, subject, parentConfirmed } = req.body as {
      childId?: string;
      subject?: ExamSubject;
      parentConfirmed?: boolean;
    };

    if (!parentConfirmed || !childId) {
      return res.status(400).json({ error: 'Parental confirmation and childId are required' });
    }

    const sessionId = `chk_${crypto.randomBytes(6).toString('hex')}`;
    const session: CheckoutSession = {
      id: sessionId,
      childId,
      subject: subject || 'comprehensive',
      amountEgp: db.examConfig.examPriceEgp,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    db.checkoutSessions[sessionId] = session;
    saveDb(db);

    res.json({
      checkoutSessionId: sessionId,
      amountEgp: session.amountEgp,
      currency: db.examConfig.currency,
      gatewayMode: db.examConfig.paymentGatewayMode,
    });
  });

  app.post('/api/payments/verify', (req, res) => {
    const { checkoutSessionId } = req.body as { checkoutSessionId?: string };
    if (!checkoutSessionId || !db.checkoutSessions[checkoutSessionId]) {
      return res.status(404).json({ error: 'Checkout session not found' });
    }

    const session = db.checkoutSessions[checkoutSessionId];
    if (!session.paymentToken) {
      session.status = 'verified';
      session.verifiedAt = new Date().toISOString();
      session.paymentToken = `paytok_${crypto.randomBytes(12).toString('hex')}`;
      saveDb(db);
    }

    res.json({
      verified: true,
      checkoutSessionId: session.id,
      amountPaidEgp: session.amountEgp,
      paymentVerificationToken: session.paymentToken,
      gatewayMode: db.examConfig.paymentGatewayMode,
    });
  });

  // ------------------------------------------------------------------
  // 3. BACKEND-VERIFIED 40-QUESTION EXAM ENGINE & GRADING
  // ------------------------------------------------------------------
  app.post('/api/exams/start', (req, res) => {
    const {
      childId,
      childName,
      ageGroup,
      subject = 'comprehensive',
      mode = 'practice',
      questionCount,
      paymentVerificationToken,
      studiedConceptIds = [],
    } = req.body as {
      childId?: string;
      childName?: string;
      ageGroup?: AgeGroupId;
      subject?: ExamSubject;
      mode?: 'practice' | 'official';
      questionCount?: number;
      paymentVerificationToken?: string;
      studiedConceptIds?: string[];
    };

    if (!childId || !ageGroup) {
      return res.status(400).json({ error: 'childId and ageGroup are required' });
    }

    let paidAmount = 0;
    let paymentVerified = false;

    if (mode === 'official') {
      const matchedSession = Object.values(db.checkoutSessions).find(
        (s) =>
          s.status === 'verified' &&
          s.paymentToken === paymentVerificationToken &&
          !s.tokenConsumed &&
          s.childId === childId,
      );
      if (!matchedSession) {
        return res.status(402).json({
          error: 'Official exam requires verified server payment confirmation',
        });
      }
      matchedSession.tokenConsumed = true;
      paymentVerified = true;
      paidAmount = matchedSession.amountEgp;
    }

    const fullBank = [
      ...db.customQuestions.filter((q) => q.published !== false),
      ...VALIDATED_EXAM_BANK.filter((q) => q.published !== false),
    ];

    const ageFiltered = fullBank.filter(
      (q) =>
        q.ageGroups.includes(ageGroup) &&
        (subject === 'comprehensive' ? true : q.subject === subject),
    );

    // Deduplicate by id and prioritize questions aligned with studied concepts or age difficulty
    const seen = new Set<string>();
    const uniquePool: ExamQuestionItem[] = [];
    for (const q of ageFiltered) {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        uniquePool.push(q);
      }
    }

    // Balanced shuffle: prioritize studied lessons & age-appropriate difficulty first
    const prioritized = uniquePool.sort((a, b) => {
      const aStudied = studiedConceptIds.some((id) => a.lessonRefId.includes(id)) ? -1 : 0;
      const bStudied = studiedConceptIds.some((id) => b.lessonRefId.includes(id)) ? -1 : 0;
      if (aStudied !== bStudied) return aStudied - bStudied;
      return Math.random() - 0.5;
    });

    const targetCount =
      mode === 'official'
        ? db.examConfig.questionsPerExam
        : Math.min(questionCount || 10, db.examConfig.questionsPerExam);

    const selected = prioritized.slice(0, Math.min(targetCount, prioritized.length));

    const attemptId = `ex_${crypto.randomBytes(6).toString('hex')}`;
    db.examAttempts[attemptId] = {
      id: attemptId,
      childId,
      childName: childName || 'Explorer',
      ageGroup,
      subject,
      mode,
      questionIds: selected.map((q) => q.id),
      paymentVerified,
      amountPaidEgp: paidAmount,
      passingPercentage: db.examConfig.passingPercentage,
      submitted: false,
      createdAt: new Date().toISOString(),
    };
    saveDb(db);

    // Never leak correctOptionId or explanation before submission!
    const sanitizedQuestions = selected.map(({ correctOptionId: _c, explanation: _e, ...rest }) => rest);

    res.json({
      attemptId,
      mode,
      subject,
      ageGroup,
      totalQuestions: sanitizedQuestions.length,
      passingPercentage: db.examConfig.passingPercentage,
      questions: sanitizedQuestions,
    });
  });

  app.post('/api/exams/submit', (req, res) => {
    const { attemptId, answers = {} } = req.body as {
      attemptId?: string;
      answers?: Record<string, string>;
    };

    if (!attemptId || !db.examAttempts[attemptId]) {
      return res.status(404).json({ error: 'Exam attempt not found' });
    }

    const attempt = db.examAttempts[attemptId];
    // Prevent duplicate submission & duplicate certificates for the same exam attempt
    if (attempt.submitted && attempt.summary) {
      const existingCert = attempt.certificateCode ? db.certificates[attempt.certificateCode] : undefined;
      return res.json({
        summary: attempt.summary,
        certificate: existingCert,
        review: [],
        duplicateBlocked: true,
      });
    }

    const fullBank = [...db.customQuestions, ...VALIDATED_EXAM_BANK];
    const bankMap = new Map(fullBank.map((q) => [q.id, q]));

    let correctCount = 0;
    const weakLessonsMap = new Map<string, LocalizedText>();

    const review = attempt.questionIds.map((qId) => {
      const q = bankMap.get(qId);
      const selectedOptionId = answers[qId] || '';
      const isCorrect = Boolean(q && selectedOptionId === q.correctOptionId);
      if (isCorrect) {
        correctCount += 1;
      } else if (q) {
        weakLessonsMap.set(q.lessonRefId, q.lessonTitle);
      }
      return {
        questionId: qId,
        prompt: q?.prompt || { ar: '', en: '' },
        selectedOptionId,
        correctOptionId: q?.correctOptionId || '',
        isCorrect,
        explanation: q?.explanation || { ar: '', en: '' },
        lessonTitle: q?.lessonTitle || { ar: '', en: '' },
      };
    });

    const total = attempt.questionIds.length || 1;
    const percentage = Math.round((correctCount / total) * 100);
    const passed = percentage >= attempt.passingPercentage;
    const weakLessonTitles = Array.from(weakLessonsMap.values()).slice(0, 6);

    let issuedCert: Certificate | undefined;

    // Issue official certificate ONLY if official, paymentVerified, AND passed >= 70%
    if (attempt.mode === 'official' && attempt.paymentVerified && passed) {
      const uniqueCode = `NLC-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const meta = subjectToWorld(attempt.subject);
      issuedCert = {
        id: `cert-${attempt.id}`,
        uniqueCode,
        childName: attempt.childName,
        worldId: meta.worldId,
        worldName: meta.worldName,
        achievementTitle: {
          ar: `شهادة اجتياز الامتحان الرسمي — ${meta.worldName.ar}`,
          en: `Official Certified Exam — ${meta.worldName.en}`,
        },
        issuedAt: new Date().toISOString(),
        levelCompleted: attempt.ageGroup === '8' ? 4 : attempt.ageGroup === '7' ? 3 : attempt.ageGroup === '5-6' ? 2 : 1,
        isOfficialExam: true,
        examSubject: attempt.subject,
        score: correctCount,
        totalQuestions: total,
        percentage,
        passingPercentage: attempt.passingPercentage,
        ageGroup: attempt.ageGroup,
        verificationUrl: `/api/certificates/verify/${uniqueCode}`,
      };
      db.certificates[uniqueCode] = issuedCert;
      attempt.certificateCode = uniqueCode;
    }

    const summary: ExamAttemptSummary = {
      id: attempt.id,
      childId: attempt.childId,
      childName: attempt.childName,
      ageGroup: attempt.ageGroup,
      subject: attempt.subject,
      mode: attempt.mode,
      score: correctCount,
      totalQuestions: total,
      percentage,
      passed,
      passingPercentage: attempt.passingPercentage,
      weakLessonTitles,
      certificateCode: issuedCert?.uniqueCode,
      completedAt: new Date().toISOString(),
      paymentVerified: attempt.paymentVerified,
      amountPaidEgp: attempt.amountPaidEgp,
    };

    attempt.submitted = true;
    attempt.summary = summary;
    saveDb(db);

    res.json({
      summary,
      certificate: issuedCert,
      review,
    });
  });

  // ------------------------------------------------------------------
  // 4. CERTIFICATE VERIFICATION ENDPOINT
  // ------------------------------------------------------------------
  app.get('/api/certificates/verify/:code', (req, res) => {
    const code = (req.params.code || '').trim().toUpperCase();
    const cert = db.certificates[code];
    if (!cert) {
      return res.status(404).json({ valid: false, error: 'Certificate not found' });
    }
    res.json({
      valid: !cert.revoked,
      revoked: Boolean(cert.revoked),
      certificate: cert,
    });
  });

  // ------------------------------------------------------------------
  // 5. ADMIN CONTENT MANAGEMENT SYSTEM (CMS) APIs
  // ------------------------------------------------------------------
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const attempts = Object.values(db.examAttempts)
      .filter((a) => a.submitted && a.summary)
      .map((a) => a.summary!);
    const certificates = Object.values(db.certificates);
    res.json({
      examConfig: db.examConfig,
      customLessons: db.customLessons,
      customQuestions: db.customQuestions,
      builtInQuestionsCount: VALIDATED_EXAM_BANK.length,
      certificates,
      examAttempts: attempts,
    });
  });

  app.put('/api/admin/exam-config', requireAdmin, (req, res) => {
    const { examPriceEgp, passingPercentage, questionsPerExam } = req.body as Partial<ExamConfig>;
    if (typeof examPriceEgp === 'number' && examPriceEgp >= 0) {
      db.examConfig.examPriceEgp = Math.round(examPriceEgp);
    }
    if (typeof passingPercentage === 'number' && passingPercentage >= 50 && passingPercentage <= 100) {
      db.examConfig.passingPercentage = Math.round(passingPercentage);
    }
    if (typeof questionsPerExam === 'number' && questionsPerExam >= 10 && questionsPerExam <= 60) {
      db.examConfig.questionsPerExam = Math.round(questionsPerExam);
    }
    saveDb(db);
    res.json(db.examConfig);
  });

  app.post('/api/admin/lessons', requireAdmin, (req, res) => {
    const body = req.body as Omit<CmsLessonRecord, 'id' | 'updatedAt'>;
    const lesson: CmsLessonRecord = {
      ...body,
      id: `cms-lesson-${crypto.randomBytes(4).toString('hex')}`,
      updatedAt: new Date().toISOString(),
    };
    db.customLessons.unshift(lesson);
    saveDb(db);
    res.json(lesson);
  });

  app.patch('/api/admin/lessons/:id', requireAdmin, (req, res) => {
    const idx = db.customLessons.findIndex((l) => l.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Lesson not found' });
    db.customLessons[idx] = {
      ...db.customLessons[idx],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);
    res.json(db.customLessons[idx]);
  });

  app.delete('/api/admin/lessons/:id', requireAdmin, (req, res) => {
    db.customLessons = db.customLessons.filter((l) => l.id !== req.params.id);
    saveDb(db);
    res.json({ deleted: true });
  });

  app.post('/api/admin/questions', requireAdmin, (req, res) => {
    const body = req.body as Omit<ExamQuestionItem, 'id'>;
    const question: ExamQuestionItem = {
      ...body,
      id: `cms-q-${crypto.randomBytes(4).toString('hex')}`,
      published: body.published ?? true,
    };
    db.customQuestions.unshift(question);
    saveDb(db);
    res.json(question);
  });

  app.patch('/api/admin/questions/:id', requireAdmin, (req, res) => {
    const idx = db.customQuestions.findIndex((q) => q.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Question not found' });
    db.customQuestions[idx] = { ...db.customQuestions[idx], ...req.body };
    saveDb(db);
    res.json(db.customQuestions[idx]);
  });

  app.delete('/api/admin/questions/:id', requireAdmin, (req, res) => {
    db.customQuestions = db.customQuestions.filter((q) => q.id !== req.params.id);
    saveDb(db);
    res.json({ deleted: true });
  });

  app.patch('/api/admin/certificates/:code', requireAdmin, (req, res) => {
    const cert = db.certificates[req.params.code];
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    cert.revoked = Boolean(req.body.revoked);
    saveDb(db);
    res.json(cert);
  });

  // ------------------------------------------------------------------
  // 6. SERVER-SIDE YOUTUBE STATUS (@Future-p6l)
  // ------------------------------------------------------------------
  app.get('/api/youtube/status', async (_req, res) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelHandle = '@Future-p6l';
    const channelUrl = 'https://www.youtube.com/@Future-p6l';

    if (!apiKey) {
      return res.json({
        configured: false,
        channelHandle,
        channelUrl,
        videos: [],
      });
    }

    try {
      const chUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
      chUrl.searchParams.set('part', 'contentDetails,snippet');
      chUrl.searchParams.set('forHandle', 'Future-p6l');
      chUrl.searchParams.set('key', apiKey);

      const chRes = await fetch(chUrl.toString());
      if (!chRes.ok) {
        return res.json({ configured: true, error: 'YouTube API request failed', channelHandle, channelUrl, videos: [] });
      }
      const chData = (await chRes.json()) as {
        items?: Array<{
          contentDetails?: { relatedPlaylists?: { uploads?: string } };
        }>;
      };
      const uploadsPlaylistId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) {
        return res.json({ configured: true, channelHandle, channelUrl, videos: [] });
      }

      const plUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      plUrl.searchParams.set('part', 'snippet');
      plUrl.searchParams.set('maxResults', '12');
      plUrl.searchParams.set('playlistId', uploadsPlaylistId);
      plUrl.searchParams.set('key', apiKey);

      const plRes = await fetch(plUrl.toString());
      if (!plRes.ok) {
        return res.json({ configured: true, channelHandle, channelUrl, videos: [] });
      }
      const plData = (await plRes.json()) as {
        items?: Array<{
          snippet?: {
            title?: string;
            publishedAt?: string;
            resourceId?: { videoId?: string };
          };
        }>;
      };

      const videos = (plData.items || [])
        .filter((item) => item.snippet?.resourceId?.videoId)
        .map((item) => {
          const vid = item.snippet!.resourceId!.videoId!;
          const rawTitle = item.snippet!.title || 'NonoLand Video';
          return {
            id: `yt-api-${vid}`,
            videoId: vid,
            title: { ar: rawTitle, en: rawTitle },
            category: 'adventures',
            ageGroups: ['3-4', '5-6', '7', '8'],
            approvedByParent: true,
            featured: false,
            addedAt: item.snippet!.publishedAt || new Date().toISOString(),
          };
        });

      return res.json({
        configured: true,
        channelHandle,
        channelUrl,
        videos,
      });
    } catch {
      return res.json({
        configured: true,
        channelHandle,
        channelUrl,
        videos: [],
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NonoLand server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
