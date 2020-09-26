const express = require('express');
const { makeAdmin, revokeAdmin } = require('../controllers/admin');
const { withPrivilege } = require('../utils/middlewares');

const router = express.Router();

router.use(withPrivilege);

router.get(`/`, (req, res) => res.sendStatus(200));
router.post(`/makeAdmin`, makeAdmin);
router.post(`/revokeAdmin`, revokeAdmin);

module.exports = router;
