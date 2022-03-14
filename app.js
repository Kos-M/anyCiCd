const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const rfs = require('rotating-file-stream');
require('dotenv').config();
const bodyParser = require('body-parser');
const { VerifySignature } = require('./routes/signatureVerify');

const app = express();

function rawBodySaver(req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}

const limiter = rateLimit({
  windowMs: 60 * 1000 * process.env.limit_minutes || 120000, // 2 minutes
  max: process.env.limit_max_requests || 100, // limit each IP to 100 requests per windowMs
//   keyGenerator(req) { // enable if using it behind cloudflare
//     return req.headers['cf-connecting-ip'];
//   },
});

// create a rotating write stream
const accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // rotate daily
  path: path.join(process.cwd(), 'logs'),
});
const shouldCompress = (req, res) => {
  if (req.headers['x-no-compression']) {
    return false; // don't compress responses with this request header
  }
  return compression.filter(req, res); // fallback to standard filter function
};

app.use(logger('combined', { stream: accessLogStream }));
app.use(limiter);

app.disable('x-powered-by');
app.use(compression({ filter: shouldCompress }));
app.use(cookieParser());

app.use(bodyParser.json({ verify: rawBodySaver }));
app.use(bodyParser.raw({ verify: rawBodySaver, type: () => true }));
app.use(bodyParser.urlencoded({ extended: true, verify: rawBodySaver }));
// app.use(express.static(path.join(__dirname, 'public')));

const { issuesRoutes, pullRoutes, repoRoutes } = require('./routes');

app.use('/api/issues', VerifySignature, issuesRoutes);
app.use('/api/pull', VerifySignature, pullRoutes);
app.use('/api/repo', VerifySignature, repoRoutes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  // next(createError(404));
  res.status(404).json({ status: 404, message: 'Not Found' });
});

module.exports = app;
