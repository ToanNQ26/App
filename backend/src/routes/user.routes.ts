import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { asyncRoute } from "../middlewares/index.js";

const router = Router();
router.get("/me/bank-account", asyncRoute(userController.getMyBankAccount));
router.put("/me/bank-account", asyncRoute(userController.updateMyBankAccount));
export default router;
