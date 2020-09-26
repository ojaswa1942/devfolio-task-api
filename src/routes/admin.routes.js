const express = require('express');
const { registerDeliveryGuy, makeAdmin, revokeAdmin } = require('../controllers/admin');

const router = express.Router();

router.use((req, res, next) => {
  const { isAuthenticated, isPrivileged } = req.context;
  if (!isAuthenticated || !isPrivileged) {
    return res.status(401).json('Not authorized');
  }
  return next();
});

router.get(`/`, (req, res) => res.sendStatus(200));
// router.get(`/delivery`, getDeliveryTeam);
// router.get(`/users`, getUsers);
// router.get(`/users`, getUsers);
router.post(`/delivery/add`, registerDeliveryGuy);
router.post(`/makeAdmin`, makeAdmin);
router.post(`/revokeAdmin`, revokeAdmin);

module.exports = router;
