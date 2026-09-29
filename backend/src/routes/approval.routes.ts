import { Router } from 'express';
import * as workflowController from '../controllers/workflow.controller.js';
import { asyncRoute } from '../middlewares/index.js';

const router = Router();
router.get('/approvals/pending', asyncRoute(workflowController.pending));
router.post('/requests/:id/approve', asyncRoute(workflowController.approve));
router.post('/requests/:id/reject', asyncRoute(workflowController.reject));
export default router;
