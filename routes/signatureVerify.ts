import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const secret: string | undefined = process.env.SECRET;
const sigHeaderNames: string[] = ['x-gitea-signature', 'X-Gitlab-Token', 'X-Hub-Signature-256'];
const sigHashAlg: string = 'sha256';

function hexHmac(key: string, data: string): Buffer {
  return Buffer.from(crypto.createHmac(sigHashAlg, key).update(data).digest('hex'), 'utf8');
}

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
  // GitHub signs the request body as sent. Gitea signs the JSON payload, which
  // for a `payload=<json>` form is the decoded field and not the form body.
  const signed: { digest: Buffer; exactPayload?: string }[] = [{ digest: hexHmac(secret, rawBody) }];
  if (req.formPayload !== undefined) {
    signed.push({ digest: hexHmac(secret, req.formPayload), exactPayload: req.formPayload });
  }
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
    const match = signed.find(({ digest }) => headerSignature.length === digest.length && crypto.timingSafeEqual(digest, headerSignature));
    if (match) {
      // The hook must get the text that was signed, so keep it for runHook.
      req.exactPayload = match.exactPayload;
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

// Wrong-URL guard: catches a webhook that was pointed at a route for another
// event. GitHub and Gitea send the same event names. The header is not part of
// the signature, so this is not replay protection. A request without the
// header runs the route as before.
function requireEvent(...events: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const event = (req.get('x-github-event') || req.get('x-gitea-event'))?.toLowerCase();
    if (!event) {
      next();
      return;
    }
    // GitHub sends ping when a webhook is created and shows the webhook as
    // failed unless it gets a 2xx. Answer it without running the hook.
    if (event === 'ping') {
      res.status(200).json({ status: 'Completed' });
      return;
    }
    if (!events.includes(event)) {
      res.status(400).json({ status: 'Failed', reason: `Event "${event}" does not match this route` });
      return;
    }
    next();
  };
}

export { VerifySignature, requireEvent };
