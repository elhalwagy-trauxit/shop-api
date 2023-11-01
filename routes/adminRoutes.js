const express = require('express');

const adminController = require('../controllers/authController');

const router = express.Router();
router.route('/login').post(adminController.login);

router
  .route('/update-my-password')
  .patch(adminController.protect, adminController.updateMyPassword);

router
  .route('/')
  .post(
    adminController.protect,
    adminController.restrictTo('head admin'),
    adminController.creatAdmin
  );

module.exports = router;
