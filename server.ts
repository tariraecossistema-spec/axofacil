import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import {
  getSupabaseServerClient,
  verifyBearerToken,
  canUserManageEstablishment
} from './server/supabaseServer';

export const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

const allowedOrigins = (process.env.ALLOWED_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origem não autorizada pelo CORS'));
      }
    },
    credentials: true
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Demasiados pedidos. Aguarde um momento antes de tentar novamente.'
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/pos/health', (_req, res) => {
  res.json({
    status: 'online',
    serverTimestamp: new Date().toISOString()
  });
});

// Sincronização autenticada de vendas e turnos do POS em tabelas Postgres
app.post('/api/pos/sync', writeRateLimiter, async (req, res) => {
  try {
    const user = await verifyBearerToken(req.headers.authorization);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Sessão inválida ou ausente. Inicie sessão para sincronizar o POS.'
      });
    }

    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Dados de sincronização inválidos.'
      });
    }

    const establishmentId = typeof body.establishmentId === 'string' ? body.establishmentId.trim() : '';
    if (!establishmentId || establishmentId.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Identificador do estabelecimento inválido.'
      });
    }

    const sales = Array.isArray(body.sales) ? body.sales : [];
    const shifts = Array.isArray(body.shifts) ? body.shifts : [];

    if (sales.length > 200 || shifts.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Lote de sincronização excede o limite permitido por pedido.'
      });
    }

    const authorized = await canUserManageEstablishment(user.id, establishmentId);
    if (!authorized) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para gerir as vendas deste estabelecimento.'
      });
    }

    const client = getSupabaseServerClient();
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'Serviço de base de dados indisponível.'
      });
    }

    let processedSales = 0;

    if (sales.length > 0) {
      const validSalesRows = sales
        .filter((s: unknown): s is Record<string, unknown> => Boolean(s && typeof s === 'object' && typeof (s as Record<string, unknown>).id === 'string'))
        .map((s) => ({
          id: String(s.id).slice(0, 100),
          establishment_id: establishmentId,
          shift_id: typeof s.shiftId === 'string' ? s.shiftId.slice(0, 100) : null,
          operator_id: user.id,
          total_amount: Math.max(0, Number(s.total) || 0),
          payment_method: typeof s.paymentMethod === 'string' ? s.paymentMethod.slice(0, 40) : 'numerario',
          payload: s,
          server_synced_at: new Date().toISOString()
        }));

      if (validSalesRows.length > 0) {
        const { error: salesErr } = await client
          .from('pos_sales')
          .upsert(validSalesRows, { onConflict: 'id', ignoreDuplicates: true });

        if (salesErr) {
          return res.status(500).json({
            success: false,
            error: 'Não foi possível guardar as vendas sincronizadas.'
          });
        }
        processedSales = validSalesRows.length;
      }
    }

    if (shifts.length > 0) {
      const validShiftRows = shifts
        .filter((sh: unknown): sh is Record<string, unknown> => Boolean(sh && typeof sh === 'object' && typeof (sh as Record<string, unknown>).id === 'string'))
        .map((sh) => ({
          id: String(sh.id).slice(0, 100),
          establishment_id: establishmentId,
          operator_id: user.id,
          status: typeof sh.status === 'string' ? sh.status.slice(0, 30) : 'aberto',
          payload: sh,
          updated_at: new Date().toISOString()
        }));

      if (validShiftRows.length > 0) {
        await client.from('pos_shifts').upsert(validShiftRows, { onConflict: 'id' });
      }
    }

    return res.json({
      success: true,
      processedSales,
      serverTimestamp: new Date().toISOString(),
      message: `${processedSales} venda(s) sincronizada(s).`
    });
  } catch {
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar a sincronização do POS.'
    });
  }
});

// Consulta autenticada do histórico de vendas do POS
app.get('/api/pos/sales', async (req, res) => {
  try {
    const user = await verifyBearerToken(req.headers.authorization);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticação necessária para consultar vendas.'
      });
    }

    const estId = typeof req.query.establishmentId === 'string' ? req.query.establishmentId.trim() : '';
    if (!estId) {
      return res.status(400).json({
        success: false,
        error: 'O parâmetro establishmentId é obrigatório.'
      });
    }

    const authorized = await canUserManageEstablishment(user.id, estId);
    if (!authorized) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para consultar vendas deste estabelecimento.'
      });
    }

    const client = getSupabaseServerClient();
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'Serviço de base de dados indisponível.'
      });
    }

    const { data, error } = await client
      .from('pos_sales')
      .select('payload, server_synced_at')
      .eq('establishment_id', estId)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao consultar vendas.'
      });
    }

    const sales = (data || []).map((row) => ({
      ...(row.payload as Record<string, unknown>),
      serverSyncedAt: row.server_synced_at
    }));

    return res.json({
      establishmentId: estId,
      total: sales.length,
      sales
    });
  } catch {
    return res.status(500).json({
      success: false,
      error: 'Erro ao consultar o histórico de vendas.'
    });
  }
});

// Upload autenticado via servidor para o Supabase Storage
app.post('/api/upload', writeRateLimiter, async (req, res) => {
  try {
    const user = await verifyBearerToken(req.headers.authorization);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Inicie sessão para enviar ficheiros.'
      });
    }

    const { fileName, mimeType, base64Data, bucket = 'uploads' } = req.body || {};
    const allowedBuckets = ['images', 'avatars', 'documents', 'uploads'];
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

    if (
      typeof fileName !== 'string' ||
      typeof mimeType !== 'string' ||
      typeof base64Data !== 'string' ||
      !allowedBuckets.includes(bucket) ||
      !allowedMimes.includes(mimeType)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Formato ou destino de ficheiro não permitido.'
      });
    }

    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const buffer = Buffer.from(cleanBase64, 'base64');

    if (buffer.byteLength === 0 || buffer.byteLength > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'O ficheiro deve ter no máximo 10 MB.'
      });
    }

    const client = getSupabaseServerClient();
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'Serviço de armazenamento indisponível.'
      });
    }

    const ext = (fileName.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5) || 'jpg';
    const objectPath = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await client.storage
      .from(bucket)
      .upload(objectPath, buffer, {
        contentType: mimeType,
        upsert: false
      });

    if (uploadErr) {
      return res.status(500).json({
        success: false,
        error: 'Não foi possível guardar o ficheiro.'
      });
    }

    const { data: urlData } = client.storage.from(bucket).getPublicUrl(objectPath);
    const publicUrl = urlData?.publicUrl || '';

    await client.from('media').insert({
      user_id: user.id,
      file_name: fileName.slice(0, 120),
      file_size: buffer.byteLength,
      mime_type: mimeType,
      public_url: publicUrl,
      supabase_url: publicUrl,
      folder: bucket
    });

    return res.json({
      success: true,
      url: publicUrl
    });
  } catch {
    return res.status(500).json({
      success: false,
      error: 'Não foi possível processar o ficheiro.'
    });
  }
});

if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    import('vite')
      .then(async ({ createServer }) => {
        const vite = await createServer({
          server: { middlewareMode: true },
          appType: 'spa'
        });
        app.use(vite.middlewares);
        app.listen(PORT, '0.0.0.0', () => {
          console.log(`Server running on http://localhost:${PORT}`);
        });
      })
      .catch((err) => {
        console.error('Failed to start Vite dev server:', err);
        app.listen(PORT, '0.0.0.0', () => {
          console.log(`Server running on http://localhost:${PORT}`);
        });
      });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

export default app;
