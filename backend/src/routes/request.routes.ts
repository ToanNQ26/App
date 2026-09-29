import { Router } from 'express';
import * as requestController from '../controllers/request.controller.js';
import * as historyController from '../controllers/history.controller.js';
import { asyncRoute } from '../middlewares/index.js';

const router = Router();
router.get('/', asyncRoute(requestController.list));
router.get('/bookmarked', asyncRoute(requestController.listBookmarked));
router.post('/:id/bookmark', asyncRoute(requestController.bookmark));
router.delete('/:id/bookmark', asyncRoute(requestController.unbookmark));
router.post('/', asyncRoute(requestController.create));
router.get('/:id/export.xlsx', asyncRoute(requestController.exportExcel));
router.get('/:id', asyncRoute(requestController.get));
router.patch('/:id', asyncRoute(requestController.update));
router.post('/:id/submit', asyncRoute(requestController.submit));
router.get('/:id/history', asyncRoute(historyController.history));
export default router;
