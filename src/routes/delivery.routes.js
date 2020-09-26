const express = require('express');
const { registerDeliveryGuy } = require('../controllers/delivery');
const { withPrivilege } = require('../utils/middlewares');

const router = express.Router();

router.use(withPrivilege);

// router.get(`/`, getDeliveryTeam);
router.post(`/add`, registerDeliveryGuy);

module.exports = router;
