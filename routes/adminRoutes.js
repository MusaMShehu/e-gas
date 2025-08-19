const express = require('express');
const adminRoute = express.Router();
const { adminAuth } = require('../middlewares/adminAuth');

const { 
  getAdminDashboard,
  getAllUsers,
  getAllSubscriptions,
  getAllProducts,
  getAllOrders,
  createNewProduct, 
  updateProduct,
  updateUserSubscription,
  updateUserStatus,
  assignOrders
} = require('../controllers/adminController');


adminRoute.get('/admin', adminAuth, getAdminDashboard);
adminRoute.get('/admin', adminAuth, getAllUsers);
adminRoute.get('/admin', adminAuth, getAllSubscriptions);
adminRoute.get('/admin', adminAuth, getAllProducts);
adminRoute.get('/admin', adminAuth, getAllOrders);

adminRoute.post('/admin', adminAuth, createNewProduct);

adminRoute.put('/admin', adminAuth, updateUserStatus);
adminRoute.put('/admin', adminAuth, updateProduct);
adminRoute.put('/admin', adminAuth, updateUserSubscription);
adminRoute.put('/admin', adminAuth, assignOrders);


module.exports = adminRoute;

