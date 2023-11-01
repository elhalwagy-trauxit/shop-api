const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const axios = require('axios');

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Admin = require('../models/adminModel');
const Order = require('../models/orderModel');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = async (user, statusCode, req, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.creatAdmin = catchAsync(async (req, res, next) => {
  if (req.body.password != req.body.passwordConfirm) {
    return next(new AppError('Password confirm do not match password.', 400));
  }
  const newAdmin = await Admin.create(req.body);

  return createSendToken(newAdmin, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  if (!req.body.password || !req.body.email) {
    return next(new AppError('Please provide us by email and password', 400));
  }

  const admin = await Admin.findOne({ email: req.body.email });

  if (
    !admin ||
    !(await admin.correctPassword(req.body.password, admin.password))
  ) {
    return next(new AppError('Incorrect email or password.', 401));
  }
  createSendToken(admin, 200, req, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in please log in to get access', 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const freshUser = await Admin.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError(
        'The user belonging to this token does not no longer exist.',
        404
      )
    );
  }

  if (freshUser.checkPasswordChanged(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log in again.', 401)
    );
  }

  req.admin = freshUser;
  res.locals.admin = freshUser;
  next();
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  const adminData = await Admin.findById(req.admin.id);
  if (!adminData) {
    return next(new AppError('User not found. Please log in again.'));
  }
  if (req.body.password != req.body.passwordConfirm) {
    return next(new AppError('Password confirm do not match password.', 400));
  }

  if (
    !adminData.correctPassword(req.body.currentPassword, req.admin.password)
  ) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  adminData.password = req.body.password;
  await adminData.save();
  res.status(200).json({
    status: 'success',
  });
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // Check if the admin's role is included in the allowed roles
    if (!roles.includes(req.admin.role)) {
      return next(
        new AppError(
          "You don't have the permission to access this service ",
          403
        )
      );
    }
    next();
  };

exports.logout = catchAsync(async (req, res, next) => {
  const admin = await Admin.findById(req.admin.id);

  if (!admin) {
    return next(new AppError('There is no Admin with this id.', 404));
  }

  await admin.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
  });
});

exports.forgetPassword = catchAsync(async (req, res, next) => {
  //get user ,check if exist
  const admin = await Admin.findOne({ email: req.body.email });

  if (!admin) {
    return next(new AppError('No admin found with this email', 404));
  }
  const randomNum = admin.CreatePasswordResetCode();
  console.log(randomNum);
  await admin.save({ validateBeforeSave: false });
  console.log(admin.passwordRestExpires);

  await new Email(admin, randomNum).sendPasswordReset();

  res.status(200).json({
    status: 'success',
    message: 'Reset code passed to your mail, Please check your inbox mails',
  });
});

exports.forgetPasswordForUser = catchAsync(async (req, res, next) => {
  //get user ,check if exist
  const admin = await Admin.findOne({ email: req.body.email });

  if (!admin) {
    return next(new AppError('No admin found with this email', 404));
  }
  const randomNum = admin.CreatePasswordResetCode();
  console.log(randomNum);
  await admin.save({ validateBeforeSave: false });
  console.log(admin.passwordRestExpires);

  await new Email(admin, randomNum).sendPasswordReset();

  res.status(200).json({
    status: 'success',
    message: 'Reset code passed to your mail, Please check your inbox mails',
  });
});

exports.addMyOrders = catchAsync(async (req, res, next) => {
  const token = req.body.token;

  // Define the API endpoint
  const apiUrl = 'https://trauxit.shop/us/wp-json/jwt-auth/v1/token/validate';

  // Create the request headers with the Authorization header
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // Send the POST request with Axios
  const response = await axios.post(apiUrl, null, { headers });
  console.log(response.data);
  if (response.data.success === true) {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log(decoded.data.user.id);
    req.body.user_id = decoded.data.user.id;

    const orders = await Order.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        orders,
      },
    });
  } else {
    return next(new AppError('Token is Invalid.', 401));
  }
});

exports.getMyOrders = catchAsync(async (req, res, next) => {
  const token = req.body.token;
  console.log(token);
  // Define the API endpoint
  const apiUrl = 'https://trauxit.shop/us/wp-json/jwt-auth/v1/token/validate';

  // Create the request headers with the Authorization header
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // Send the POST request with Axios
  const response = await axios.post(apiUrl, null, { headers });
  console.log(response.data);
  if (response.data.success === true) {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log(decoded.data.user.id);
    req.body.user_id = decoded.data.user.id;

    let orders = await Order.find({ user_id: decoded.data.user.id }).select(
      'order_id -_id'
    );
    const user_id = decoded.data.user.id;
    return res.status(200).json({
      status: 'success',
      data: {
        user_id,
        orders,
      },
    });
  } else {
    return next(new AppError('Token is Invalid.', 401));
  }

  return next(new AppError('There is Axios Error.', 400));
});

exports.updateMyOrder = catchAsync(async (req, res, next) => {
  const token = req.body.token;

  // Define the API endpoint
  const apiUrl = 'https://trauxit.shop/us/wp-json/jwt-auth/v1/token/validate';

  // Create the request headers with the Authorization header
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // Send the POST request with Axios
  const response = await axios.post(apiUrl, null, { headers });
  console.log(response.data);
  if (response.data.success === true) {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log(decoded.data.user.id);
    req.body.user_id = decoded.data.user.id;

    const orders = await Order.findOneAndUpdate(
      { user_id: decoded.data.user.id },
      {
        $push: { order_id: req.body.order_id },
      },
      {
        new: true,
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        orders,
      },
    });
  } else {
    return next(new AppError('Token is Invalid.', 401));
  }
});
