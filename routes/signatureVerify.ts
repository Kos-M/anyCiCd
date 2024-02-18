import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const secret: string | undefined = process.env.SECRET;
const sigHeaderName: string = 'x-gitea-signature';
const sigHashAlg: string = 'sha256';
 

function VerifySignature(req: Request, res: Response, next: NextFunction): void {
  if (!req.body || !req.rawBody) {
    res.setHeader('Content-Type', 'application/json');
    res.status(400).json({ error: 'Request body empty' });
    return;
  }
  const headerSignature: Buffer = Buffer.from(req.get(sigHeaderName) || '', 'utf8');
  if (!secret) {
    res.status(500).json({ error: 'Internal Server Error', reason: 'Secret is not defined' });
    return;
  }

  const hmac: crypto.Hmac = crypto.createHmac(sigHashAlg, secret);
  const digest: Buffer = Buffer.from(`${hmac.update(req.rawBody).digest('hex')}`, 'utf8');

  if (headerSignature.length !== digest.length || !crypto.timingSafeEqual(digest, headerSignature)) {
    res.status(400).json({
      error: 'Data validation failed',
      reason: `Request body digest (${digest}) did not match ${sigHeaderName} (${headerSignature})`
    });
    return;
  }
  next();
}

export { VerifySignature };
