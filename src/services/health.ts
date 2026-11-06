// Vercel Serverless Function for POS Heartbeat & Health Check

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'online',
    platform: 'Vercel Serverless',
    timestamp: new Date().toISOString(),
    supportedEndpoints: ['/api/pos/sync', '/api/pos/health', '/api/pos/sales']
  });
}
