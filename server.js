require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
// const bodyParser = require('body-parser');
const errorHandler = require('./middleware/error');
// const morgan = require('morgan');
//const helmet = require('helmet');
// require('express-async-errors');


// Route files
const auth = require('./routes/authRoutes');
const users = require('./routes/userRoutes');
const products = require('./routes/productRoutes');
const orders = require('./routes/orderRoutes');
const subscriptions = require('./routes/subscriptionRoutes');
const payments = require('./routes/paymentRoutes');
const support = require('./routes/supportRoutes');


const path = require('path');

const app = express();
app.use (cors())
app.use(express.json());

app.use(express.static('Public'));


// app.get('', (req, res) => {
//     res.send("WELCOME TO EGAS WEBSITE");
// });

// Connect DB
connectDB();

// Middleware
// app.use(helmet());
// app.use(morgan('dev'));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));



// new
// after existing app.use('/api/auth', require('./routes/auth'));
//app.use('/api/users', require('./routes/userRoutes'));

// Simple admin UI pages (optional)
// app.get('/admin', (req, res) => res.render('admin-dashboard'));
//app.get('/admin/orders', (req, res) => res.render('admin-orders'));

// Error handler
// app.use(errorHandler);



// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/products', products);
app.use('/api/v1/orders', orders);
app.use('/api/v1/subscriptions', subscriptions);
app.use('/api/v1/payments', payments);
app.use('/api/v1/support', support);

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
