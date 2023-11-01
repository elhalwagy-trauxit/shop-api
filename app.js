const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const path = require('path');

const AppError = require('./utils/appError');
const errorController = require('./controllers/errorController');
const notificationRouter = require('./routes/notifyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const app = express();
app.set('view engine', 'pug');
app.set('/views', path.join(__dirname, 'views'));

app.use(express.json({}));
app.use(cors());
//Implement CORS
// app.use(cors());

// app.options("*", cors());

//serving static file
app.use('/public/img/', express.static(path.join(__dirname, 'public/img/')));

//development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(cookieParser());

app.use('/us/api/v1/notify', notificationRouter);
app.use('/us/api/v1/admin', adminRoutes);
app.use('/us/api/v1/order', orderRoutes);

app.get('/favicon.ico', (req, res) => {
  // Send a 204 No Content response to indicate that there's no favicon.
  res.status(204).end();
});

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!!`, 404));
});
app.use(errorController);

module.exports = app;
