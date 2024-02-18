import express, { Request, Response, NextFunction } from 'express';

const router = express.Router();

/* GET home page. */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.json({ test: 'ok' });
});

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  // console.dir(req.body)
  const giteaSignature: string | undefined = req.headers['x-gitea-signature'] as string;
  console.dir(giteaSignature);

  res.json({ test: 'ok' });
});

export default router;
