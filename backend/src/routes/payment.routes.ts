import { Router } from 'express';
import * as documentController from '../controllers/document.controller.js';
import * as historyController from '../controllers/history.controller.js';
import * as workflowController from '../controllers/workflow.controller.js';
import { asyncRoute, uploadDocument } from '../middlewares/index.js';

const router = Router();
router.get('/requests/:id/payment-documents', asyncRoute(documentController.list));
router.get('/requests/:id/payment-documents/:documentId/file', asyncRoute(documentController.viewFile));
router.post('/requests/:id/payment-documents', asyncRoute(documentController.authorizeUpload), uploadDocument.single('file'), asyncRoute(documentController.upload));
router.post('/requests/:id/payment-documents/submit', asyncRoute(workflowController.submitDocuments));
router.post('/requests/:id/accountant-check', asyncRoute(workflowController.accountantCheck));
router.post('/requests/:id/chairman-approve', asyncRoute(workflowController.chairmanApprove));
router.post('/requests/:id/chairman-reject', asyncRoute(workflowController.chairmanReject));
router.post('/requests/:id/disburse', asyncRoute(workflowController.disburse));
router.get('/requests/:id/disbursement/export', asyncRoute(workflowController.exportDisbursement));
router.get('/requests/:id/disbursement', asyncRoute(historyController.disbursements));
export default router;
