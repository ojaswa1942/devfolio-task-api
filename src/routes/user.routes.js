const express = require('express');
const { register, login, getUser } = require('../controllers/user');

const router = express.Router();

router.post(`/login`, login);
router.post(`/register`, register);

// Protected routes below
router.use((req, res, next) => {
  if (!req.context.isAuthenticated) {
    return res.status(401).json('Not authorized');
  }
  return next();
});

router.get('/', getUser);

module.exports = router;
