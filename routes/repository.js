const express = require('express');
const shell = require('shelljs');

const router = express.Router();

const pushExec = process.env.repo_push || null;
const createExec = process.env.repo_create || null;
const deleteExec = process.env.repo_delete || null;

const branhCreateExec = process.env.repo_branch_create || null;
const branhDeleteExec = process.env.repo_branch_delete || null;
const tagCreateExec = process.env.repo_tag_create || null;
const tagDeleteExec = process.env.repo_tag_delete || null;


router.post('/push', (req, res, next) => {
  if (!pushExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode = shell.exec(`${pushExec} '${JSON.stringify(req.body)}'`).code;
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
    // shell.exit(1);
  }
  return res.json({
    status: 'Completed',
  });
});

router.post('/create', (req, res, next) => {
  if (!createExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode = shell.exec(`${createExec} '${JSON.stringify(req.body)}'`).code;
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
    // shell.exit(1);
  }
  return res.json({
    status: 'Completed',
  });
});

router.post('/delete', (req, res, next) => {
  if (!deleteExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode = shell.exec(`${deleteExec} '${JSON.stringify(req.body)}'`).code;
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
    // shell.exit(1);
  }
  return res.json({
    status: 'Completed',
  });
});

router.post('/branch/create', (req, res, next) => {
  if (!branhCreateExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode = shell.exec(`${branhCreateExec} '${JSON.stringify(req.body)}'`).code;
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
    // shell.exit(1);
  }
  return res.json({
    status: 'Completed',
  });
});

router.post('/branch/delete', (req, res, next) => {
  if (!branhDeleteExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode = shell.exec(`${branhDeleteExec} '${JSON.stringify(req.body)}'`).code;
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
    // shell.exit(1);
  }
  return res.json({
    status: 'Completed',
  });
});

router.post('/tag/create', (req, res, next) => {
  if (!tagCreateExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode = shell.exec(`${tagCreateExec} '${JSON.stringify(req.body)}'`).code;
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
    // shell.exit(1);
  }
  return res.json({
    status: 'Completed',
  });
});

router.post('/tag/delete', (req, res, next) => {
  if (!tagDeleteExec) {
    return res.status(500).json({
      status: 'Failed',
      reason: 'Not defined executable script for this event',
    });
  }
  const execReturnCode = shell.exec(`${tagDeleteExec} '${JSON.stringify(req.body)}'`).code;
  if (execReturnCode !== 0) {
    return res.status(500).json({
      status: 'Failed',
      reason: `Executable exit with status code ${execReturnCode}`,
    });
    // shell.exit(1);
  }
  return res.json({
    status: 'Completed',
  });
});

module.exports = router;
