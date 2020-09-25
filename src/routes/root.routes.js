const express = require('express');

const router = express.Router();

router.use((req, res, next) => {
  const { isAuthenticated, isPrivileged } = req.context;
  if (!isAuthenticated || !isPrivileged) {
    return res.status(401).json('Not authorized');
  }
  return next();
});

router.get(`/`, (req, res) => res.sendStatus(200));

module.exports = router;
