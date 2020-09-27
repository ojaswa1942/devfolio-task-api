const express = require('express');
const { newOrder } = require('../controllers/orders');
const { withAuth } = require('../utils/middlewares');

const router = express.Router();

router.use(withAuth);
router.post(`/new`, newOrder);

module.exports = router;
