const express = require('express');
const { register, login, getUser, getAllUsers } = require('../controllers/user');
const { withPrivilege, withAuth } = require('../utils/middlewares');

const router = express.Router();

router.post(`/login`, login);
router.post(`/register`, register);

// Protected routes below
router.use(withAuth);
router.get('/', getUser);

// Admin only routes below
router.use(withPrivilege);
router.get('/all', getAllUsers);

module.exports = router;
