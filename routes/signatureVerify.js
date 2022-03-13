const crypto = require('crypto');

const secret = process.env.SECRET;
const sigHeaderName = 'x-gitea-signature';
const sigHashAlg = 'sha256';

function VerifySignature(req, res, next) {
  if (!req.body) {
    return next('Request body empty');
  }

  const headerSignature = Buffer.from(req.get(sigHeaderName) || '', 'utf8');
  const hmac = crypto.createHmac(sigHashAlg, secret);
  const digest = Buffer.from(`${hmac.update(req.rawBody).digest('hex')}`, 'utf8');

  if (headerSignature.length !== digest.length
     || !crypto.timingSafeEqual(digest, headerSignature)) {
    return next(`Request body digest (${digest}) did not match ${sigHeaderName} (${headerSignature})`);
  }
  return next();
}

module.exports = { VerifySignature };
