import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const secret: string | undefined = process.env.SECRET;
const sigHeaderNames: string[] = ['x-gitea-signature', 'X-Gitlab-Token', 'X-Hub-Signature-256'];
const sigHashAlg: string = 'sha256';

function VerifySignature(req: Request, res: Response, next: NextFunction): void {
  if (!req.body || !req.rawBody) {
    res.setHeader('Content-Type', 'application/json');
    res.status(400).json({ error: 'Request body empty' });
    return;
  }
  if (!secret) {
    res.status(500).json({ error: 'Internal Server Error', reason: 'Secret is not defined' });
    return;
  }
  const rawBody: string = req.rawBody || '';
  let matchProvider: boolean =false;
  sigHeaderNames.forEach((headerKey) => {
    let headerSignature: Buffer = Buffer.from(req.get(headerKey) || '', 'utf8');
    if (headerKey === 'X-Hub-Signature-256'){
      const githubSignature = req.get(headerKey)?.replace('sha256=', '');
      headerSignature = Buffer.from(githubSignature || '', 'utf8');
    }else if ( headerKey === 'X-Gitlab-Token' && secret != null && secret !== '' && secret !== undefined){ // plain secret format for Gitlab
      if( secret === req.get(headerKey)  ){
        matchProvider = true;
        next();
      }
    }
    const hmac: crypto.Hmac = crypto.createHmac(sigHashAlg, secret);
    const digest: Buffer = Buffer.from(`${hmac.update(rawBody).digest('hex')}`, 'utf8');
    
    if (headerSignature.length == digest.length && crypto.timingSafeEqual(digest, headerSignature)) {
      matchProvider = true
      next();
    }
  });
  if ( matchProvider) return;
  res.status(400).json({
    error: 'Data validation failed',
    reason: `Secret validation failed, supported signature headers:${sigHeaderNames}`,
  });
}

export { VerifySignature };
