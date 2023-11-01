const multer = require('multer');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Notify = require('../models/notifyModel');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  console.log(file);

  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only image.', 400));
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

const uploadNotifyImage = upload.fields([
  {
    name: 'image',
    maxCount: 1,
  },
]);

exports.resizeImage = catchAsync(async (req, res, next) => {
  if (!req.files.image) {
    return next();
  }
  req.body.image = `req.user.id-${Date.now()}.jpeg`;
});
exports.createNotification = catchAsync(async (req, res, next) => {
  const newNotification = await Notify.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      newNotification,
    },
  });
});
