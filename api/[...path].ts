import type { Request, Response } from 'express';
import app from '../backend/src/index';

// Rewrites send every /api/* URL to this one Express function.
export default function handler(req: Request, res: Response) {
  const apiPath = req.query.path;

  if (typeof apiPath === 'string' || Array.isArray(apiPath)) {
    const originalUrl = new URL(req.url || '/', `https://${req.headers.host || 'finora.vercel.app'}`);
    originalUrl.searchParams.delete('path');
    const routePath = Array.isArray(apiPath) ? apiPath.join('/') : apiPath;
    req.url = `/api/${routePath}${originalUrl.search}`;
  }

  return app(req, res);
}
