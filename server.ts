import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Server-side YouTube integration status & optional official uploads fetcher
  // Never exposes YOUTUBE_API_KEY to the client and never invents fake video IDs.
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
