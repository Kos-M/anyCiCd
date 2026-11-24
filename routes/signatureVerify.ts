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
  let matchProvider: boolean = false;
  for (const headerKey of sigHeaderNames) {
    if (headerKey === 'X-Gitlab-Token') {
      // plain secret format for Gitlab
      if (secret === req.get(headerKey)) {
        matchProvider = true;
        break;
      }
      continue;
    }
    let presented = req.get(headerKey) || '';
    if (headerKey === 'X-Hub-Signature-256') {
      presented = presented.replace(/^sha256=/i, '');
    }
    const headerSignature: Buffer = Buffer.from(presented, 'utf8');
    const digest: Buffer = Buffer.from(crypto.createHmac(sigHashAlg, secret).update(rawBody).digest('hex'), 'utf8');

    if (headerSignature.length === digest.length && crypto.timingSafeEqual(digest, headerSignature)) {
      matchProvider = true;
      break;
    }
  }
  if (!matchProvider) {
    res.status(400).json({
      error: 'Data validation failed',
      reason: `Secret validation failed, supported signature headers:${sigHeaderNames}`,
    });
    return;
  }
  next();
}

// GitHub and Gitea send the same event names. The route, not this header,
// used to decide which script ran, so a signed push could be replayed onto
// the delete URL. Absent header keeps the old behavior.
const routeEvents: Record<string, string[]> = {
  '/api/repo/push': ['push'],
  '/api/repo/create': ['create'],
  '/api/repo/delete': ['delete'],
  '/api/repo/fork': ['fork'],
  '/api/repo/branch/create': ['create'],
  '/api/repo/branch/delete': ['delete'],
  '/api/repo/tag/create': ['create'],
  '/api/repo/tag/delete': ['delete'],
  '/api/repo/release/publish': ['release'],
  '/api/repo/release/update': ['release'],
  '/api/repo/release/delete': ['release'],
  '/api/issues/open': ['issues'],
  '/api/issues/close': ['issues'],
  '/api/issues/reopen': ['issues'],
  '/api/issues/update': ['issues'],
  '/api/issues/label/clear': ['issues'],
  '/api/issues/label/update': ['issues'],
  '/api/issues/assign': ['issues'],
  '/api/issues/unassign': ['issues'],
  '/api/issues/milestone': ['issues'],
  '/api/issues/demilestone': ['issues'],
  '/api/issues/comment/create': ['issue_comment'],
  '/api/issues/comment/update': ['issue_comment'],
  '/api/issues/comment/delete': ['issue_comment'],
};

function expectMatchingEvent(req: Request, res: Response, next: NextFunction): void {
  const header = req.get('x-github-event') || req.get('x-gitea-event');
  if (!header) {
    next();
    return;
  }
  const path = req.originalUrl.split('?')[0].replace(/\/$/, '') || '/';
  const expected = routeEvents[path];
  if (expected && !expected.includes(header.toLowerCase())) {
    res.status(400).json({
      status: 'Failed',
      reason: `Event "${header}" does not match this route`,
    });
    return;
  }
  next();
}

export { VerifySignature, expectMatchingEvent };
