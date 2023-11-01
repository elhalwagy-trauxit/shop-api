const express = require('express');

const notifyController = require('../controllers/notifyController');

const router = express.Router();

router.route('/').post(notifyController.createNotification);

module.exports = router;
