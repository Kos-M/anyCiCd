import express, { Request, Response, NextFunction } from 'express';
import { runHook } from './execHook';

const router = express.Router();

const openExec: string | null = process.env.issues_open || null;
const closeExec: string | null = process.env.issues_close || null;
const reopenExec: string | null = process.env.issues_reopen || null;
const updateExec: string | null = process.env.issues_update || null;

const labelClearExec: string | null = process.env.issues_label_clear || null;
const labelUpdateExec: string | null = process.env.issues_label_update || null;

const commentCreateExec: string | null = process.env.issues_comment_create || null;
const commentUpdateExec: string | null = process.env.issues_comment_update || null;
const commentDeleteExec: string | null = process.env.issues_comment_delete || null;

const assignExec: string | null = process.env.issues_assign || null;
const unassignExec: string | null = process.env.issues_unassign || null;

const milestoneExec: string | null = process.env.issues_milestone || null;
const demilestoneExec: string | null = process.env.issues_demilestone || null;

router.post('/open', (req: Request, res: Response, next: NextFunction) => {
  if (!openExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  if (req.body.action !== 'opened') return res.end();
  const execReturnCode: number = runHook(openExec, req.body);
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

router.post('/close', (req: Request, res: Response, next: NextFunction) => {
  if (!closeExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  if (req.body.action !== 'closed') return res.end();
  const execReturnCode: number = runHook(closeExec, req.body);
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

router.post('/reopen', (req: Request, res: Response, next: NextFunction) => {
  if (!reopenExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  if (req.body.action !== 'reopened') return res.end();
  const execReturnCode: number = runHook(reopenExec, req.body);
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

router.post('/update', (req: Request, res: Response, next: NextFunction) => {
  if (!updateExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  if (req.body.action !== 'edited') return res.end();
  const execReturnCode: number = runHook(updateExec, req.body);
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

router.post('/label/clear', (req: Request, res: Response, next: NextFunction) => {
  if (!labelClearExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  if (req.body.action !== 'label_cleared') return res.end();
  const execReturnCode: number = runHook(labelClearExec, req.body);
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

router.post('/label/update', (req: Request, res: Response, next: NextFunction) => {
  if (!labelUpdateExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  if (req.body.action !== 'label_updated') return res.end();
  const execReturnCode: number = runHook(labelUpdateExec, req.body);
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

router.post('/comment/create', (req: Request, res: Response, next: NextFunction) => {
  if (!commentCreateExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  if (req.body.action !== 'created') return res.end();
  const execReturnCode: number = runHook(commentCreateExec, req.body);
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

router.post('/comment/update', (req: Request, res: Response, next: NextFunction) => {
  if (!commentUpdateExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  if (req.body.action !== 'edited') return res.end();
  const execReturnCode: number = runHook(commentUpdateExec, req.body);
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

router.post('/comment/delete', (req: Request, res: Response, next: NextFunction) => {
  if (!commentDeleteExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  if (req.body.action !== 'deleted') return res.end();
  const execReturnCode: number = runHook(commentDeleteExec, req.body);
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

router.post('/assign', (req: Request, res: Response, next: NextFunction) => {
  if (!assignExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  if (req.body.action !== 'assigned') return res.end();
  const execReturnCode: number = runHook(assignExec, req.body);
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

router.post('/unassign', (req: Request, res: Response, next: NextFunction) => {
  if (!unassignExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  if (req.body.action !== 'unassigned') return res.end();
  const execReturnCode: number = runHook(unassignExec, req.body);
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

router.post('/milestone', (req: Request, res: Response, next: NextFunction) => {
  if (!milestoneExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  if (req.body.action !== 'milestoned') return res.end();
  const execReturnCode: number = runHook(milestoneExec, req.body);
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

router.post('/demilestone', (req: Request, res: Response, next: NextFunction) => {
  if (!demilestoneExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  if (req.body.action !== 'demilestoned') return res.end();
  const execReturnCode: number = runHook(demilestoneExec, req.body);
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
