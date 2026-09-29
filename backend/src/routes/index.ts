import { Router } from 'express';
import { authenticate } from '../middlewares/index.js';
import authRoutes from './auth.routes.js';
import requestRoutes from './request.routes.js';
import approvalRoutes from './approval.routes.js';
import paymentRoutes from './payment.routes.js';
import adminRoutes from './admin.routes.js';
import userRoutes from './user.routes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use(authenticate);
router.use('/requests', requestRoutes);
router.use('/users', userRoutes);
router.use(approvalRoutes);
router.use(paymentRoutes);
router.use('/admin', adminRoutes);
export default router;
