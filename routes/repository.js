const express = require('express');
const shell = require('shelljs');

const router = express.Router();
const pushExec = process.env.repo_push || null;

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

module.exports = router;
