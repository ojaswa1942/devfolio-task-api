const express = require('express');
const { registerDeliveryGuy, getDeliveryGuys, updateLocation } = require('../controllers/delivery');
const { withPrivilege, withAuth } = require('../utils/middlewares');

const router = express.Router();

router.use(withAuth);
router.post('/updateLocation', updateLocation);

router.use(withPrivilege);
router.get(`/`, getDeliveryGuys);
router.post(`/add`, registerDeliveryGuy);

module.exports = router;
