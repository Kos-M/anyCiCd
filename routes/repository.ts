import express, { Request, Response, NextFunction } from 'express';
import { runHook } from './execHook';
import { requireEvent } from './signatureVerify';

const router = express.Router();

const pushExec: string | null = process.env.repo_push || null;
const createExec: string | null = process.env.repo_create || null;
const deleteExec: string | null = process.env.repo_delete || null;

const branhCreateExec: string | null = process.env.repo_branch_create || null;
const branhDeleteExec: string | null = process.env.repo_branch_delete || null;
const tagCreateExec: string | null = process.env.repo_tag_create || null;
const tagDeleteExec: string | null = process.env.repo_tag_delete || null;

const forkExec: string | null = process.env.repo_fork || null;

const releasePublishExec: string | null = process.env.repo_release_publish || null;
const releaseUpdateExec: string | null = process.env.repo_release_update || null;
const releaseDeleteExec: string | null = process.env.repo_release_delete || null;

router.post('/push', requireEvent('push'), (req: Request, res: Response, next: NextFunction) => {
  if (!pushExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = runHook(pushExec, req.body, req.exactPayload);
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
  }
  return res.json({
    status: 'Completed',
  });
});

router.post('/create', requireEvent('create'), (req: Request, res: Response, next: NextFunction) => {
  if (!createExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = runHook(createExec, req.body, req.exactPayload);
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
  }
  return res.json({
    status: 'Completed',
  });
});

router.post('/delete', requireEvent('delete'), (req: Request, res: Response, next: NextFunction) => {
  if (!deleteExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = runHook(deleteExec, req.body, req.exactPayload);
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
  }
  return res.json({
    status: 'Completed',
  });
});

router.post('/branch/create', requireEvent('create'), (req: Request, res: Response, next: NextFunction) => {
  if (!branhCreateExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = runHook(branhCreateExec, req.body, req.exactPayload);
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
  }
  return res.json({
    status: 'Completed',
  });
});

router.post('/branch/delete', requireEvent('delete'), (req: Request, res: Response, next: NextFunction) => {
  if (!branhDeleteExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = runHook(branhDeleteExec, req.body, req.exactPayload);
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
  }
  return res.json({
    status: 'Completed',
  });
});

router.post('/tag/create', requireEvent('create'), (req: Request, res: Response, next: NextFunction) => {
  if (!tagCreateExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = runHook(tagCreateExec, req.body, req.exactPayload);
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
  }
  return res.json({
    status: 'Completed',
  });
});

router.post('/tag/delete', requireEvent('delete'), (req: Request, res: Response, next: NextFunction) => {
  if (!tagDeleteExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = runHook(tagDeleteExec, req.body, req.exactPayload);
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
  }
  return res.json({
    status: 'Completed',
  });
});

router.post('/fork', requireEvent('fork'), (req: Request, res: Response, next: NextFunction) => {
  if (!forkExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = runHook(forkExec, req.body, req.exactPayload);
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
  }
  return res.json({
    status: 'Completed',
  });
});

router.post('/release/publish', requireEvent('release'), (req: Request, res: Response, next: NextFunction) => {
  if (!releasePublishExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = runHook(releasePublishExec, req.body, req.exactPayload);
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
  }
  return res.json({
    status: 'Completed',
  });
});

router.post('/release/update', requireEvent('release'), (req: Request, res: Response, next: NextFunction) => {
  if (!releaseUpdateExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = runHook(releaseUpdateExec, req.body, req.exactPayload);
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
  }
  return res.json({
    status: 'Completed',
  });
});

router.post('/release/delete', requireEvent('release'), (req: Request, res: Response, next: NextFunction) => {
  if (!releaseDeleteExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = runHook(releaseDeleteExec, req.body, req.exactPayload);
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
  }
  return res.json({
    status: 'Completed',
  });
});

export default router;
