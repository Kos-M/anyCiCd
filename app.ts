import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import {createStream} from 'rotating-file-stream';

import bodyParser from 'body-parser';
import dotenv from 'dotenv';
dotenv.config();
import { VerifySignature } from './routes/signatureVerify';


const app = express();

// Extend the Request interface to include rawBody property
declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
    }
  }
}

function rawBodySaver(req: Request, res: Response, buf: Buffer, encoding: BufferEncoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}

const limiter = rateLimit({
  windowMs: 60 * 1000 * Number(process.env.limit_minutes) || 120000, // 2 minutes
  max: Number(process.env.limit_max_requests) || 100, // limit each IP to 100 requests per windowMs
  //   keyGenerator(req) { // enable if using it behind cloudflare
  //     return req.headers['cf-connecting-ip'];
  //   },
});

// create a rotating write stream
const accessLogStream = createStream('access.log', {
  interval: '1d', // rotate daily
  path: path.join(process.cwd(), 'logs'),
});

const shouldCompress = (req: Request, res: Response): boolean => {
  if (req.headers['x-no-compression']) {
    return false; // don't compress responses with this request header
  }
  return compression.filter(req, res); // fallback to standard filter function
};

app.use(logger('combined', { stream: accessLogStream }));
app.use(helmet());
app.use(limiter);

app.disable('x-powered-by');
app.use(compression({ filter: shouldCompress }));
app.use(cookieParser());

app.use(bodyParser.json({ verify: rawBodySaver }));
app.use(bodyParser.raw({ verify: rawBodySaver, type: () => true }));
app.use(bodyParser.urlencoded({ extended: true, verify: rawBodySaver }));
// app.use(express.static(path.join(__dirname, 'public')));

import { issuesRoutes, pullRoutes, repoRoutes } from './routes';

app.use('/api/issues', VerifySignature, issuesRoutes);
app.use('/api/pull', VerifySignature, pullRoutes);
app.use('/api/repo', VerifySignature, repoRoutes);

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  // next(createError(404));
  res.status(404).json({ status: 404, message: 'Not Found' });
});

export default app;
