const express = require('express');
const { registerDeliveryGuy, getDeliveryGuys } = require('../controllers/delivery');
const { withPrivilege } = require('../utils/middlewares');

const router = express.Router();

router.use(withPrivilege);

router.get(`/`, getDeliveryGuys);
router.post(`/add`, registerDeliveryGuy);

module.exports = router;
