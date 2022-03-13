const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.json({ test: 'ok' });
});

router.post('/', (req, res, next) => {
  // console.dir(req.body)
  const giteaSignature = req.headers['x-gitea-signature'];
  console.dir(giteaSignature);

  res.json({ test: 'ok' });
});

module.exports = router;
