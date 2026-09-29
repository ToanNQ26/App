import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { asyncRoute, authenticate } from '../middlewares/index.js';

const router = Router();
router.post('/login', asyncRoute(authController.login));
router.get('/me', authenticate, asyncRoute(authController.me));
export default router;
