const express = require('express');
const router = express.Router();

const authRoute = require('./authRoute');
const taskRoute = require('./taskRoute');

router.use('/auth', authRoute);
router.use('/task', taskRoute);


module.exports = router;