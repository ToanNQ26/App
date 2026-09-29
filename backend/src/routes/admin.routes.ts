import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { asyncRoute, requireRoles } from '../middlewares/index.js';

const router = Router();
router.use(requireRoles('ADMIN'));
router.get('/users', asyncRoute(adminController.listUsers));
router.post('/users', asyncRoute(adminController.createUser));
router.patch('/users/:id', asyncRoute(adminController.updateUser));
router.get('/departments', asyncRoute(adminController.listDepartments));
router.post('/departments', asyncRoute(adminController.createDepartment));
router.patch('/departments/:id', asyncRoute(adminController.updateDepartment));
export default router;
