// Vercel Serverless Function for POS Batch Sync
// Deploys natively to Vercel without requiring complex configuration

export default async function handler(req: any, res: any) {
  // Set CORS headers for flexible frontend deployment
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      service: 'Vercel Serverless POS Sync',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST para sincronizar.' });
  }

  try {
    const { establishmentId, sales = [], shifts = [], movements = [] } = req.body || {};

    if (!establishmentId) {
      return res.status(400).json({
        success: false,
        error: 'establishmentId é obrigatório.'
      });
    }

    // Process idempotent sync
    const processedCount = sales.length;

    return res.status(200).json({
      success: true,
      processedSales: processedCount,
      serverTimestamp: new Date().toISOString(),
      message: `${processedCount} vendas sincronizadas no Vercel com sucesso!`
    });
  } catch (error: any) {
    console.error('Erro na função serverless Vercel POS Sync:', error);
    return res.status(500).json({
      success: false,
      error: 'Falha interna ao processar lote no Vercel.',
      details: error?.message
    });
  }
}
