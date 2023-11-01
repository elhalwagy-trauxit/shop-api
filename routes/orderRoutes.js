const express = require('express');

const authController = require('../controllers/authController');

const router = express.Router();
router.route('/add-my-orders/').post(authController.addMyOrders);
router.route('/get-my-orders/').get(authController.getMyOrders);
router.route('/update-my-orders/').patch(authController.updateMyOrder);
// router
//   .route('/update-my-password')
//   .patch(adminController.protect, adminController.updateMyPassword);

// router
//   .route('/')
//   .post(
//     adminController.protect,
//     adminController.restrictTo('head admin'),
//     adminController.creatAdmin
//   );

module.exports = router;
