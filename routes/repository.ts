import express, { Request, Response, NextFunction } from 'express';
import shell from 'shelljs';

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

router.post('/push', (req: Request, res: Response, next: NextFunction) => {
  if (!pushExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = shell.exec(`${pushExec} '${JSON.stringify(req.body)}'`).code;
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

router.post('/create', (req: Request, res: Response, next: NextFunction) => {
  if (!createExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = shell.exec(`${createExec} '${JSON.stringify(req.body)}'`).code;
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

router.post('/delete', (req: Request, res: Response, next: NextFunction) => {
  if (!deleteExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = shell.exec(`${deleteExec} '${JSON.stringify(req.body)}'`).code;
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

router.post('/branch/create', (req: Request, res: Response, next: NextFunction) => {
  if (!branhCreateExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = shell.exec(`${branhCreateExec} '${JSON.stringify(req.body)}'`).code;
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

router.post('/branch/delete', (req: Request, res: Response, next: NextFunction) => {
  if (!branhDeleteExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = shell.exec(`${branhDeleteExec} '${JSON.stringify(req.body)}'`).code;
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

router.post('/tag/create', (req: Request, res: Response, next: NextFunction) => {
  if (!tagCreateExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = shell.exec(`${tagCreateExec} '${JSON.stringify(req.body)}'`).code;
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

router.post('/tag/delete', (req: Request, res: Response, next: NextFunction) => {
  if (!tagDeleteExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = shell.exec(`${tagDeleteExec} '${JSON.stringify(req.body)}'`).code;
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

router.post('/fork', (req: Request, res: Response, next: NextFunction) => {
  if (!forkExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = shell.exec(`${forkExec} '${JSON.stringify(req.body)}'`).code;
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

router.post('/release/publish', (req: Request, res: Response, next: NextFunction) => {
  if (!releasePublishExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = shell.exec(`${releasePublishExec} '${JSON.stringify(req.body)}'`).code;
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

router.post('/release/update', (req: Request, res: Response, next: NextFunction) => {
  if (!releaseUpdateExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = shell.exec(`${releaseUpdateExec} '${JSON.stringify(req.body)}'`).code;
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

router.post('/release/delete', (req: Request, res: Response, next: NextFunction) => {
  if (!releaseDeleteExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode: number = shell.exec(`${releaseDeleteExec} '${JSON.stringify(req.body)}'`).code;
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