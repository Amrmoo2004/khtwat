import { Router } from "express";
import * as dashboardController from './dashboard.controller.js';
import { isAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

// Apply isAdmin middleware to all routes in this router
router.use(isAdmin);

// --- Analytics & Stats ---
router.get("/stats/general", dashboardController.getGeneralStats);
router.get("/stats/questions", dashboardController.getQuestionStats);

// --- Questions Management ---
router.get("/questions", dashboardController.getAllQuestions);
router.post("/questions", dashboardController.addQuestion);
router.put("/questions/:id", dashboardController.updateQuestion);
router.delete("/questions/:id", dashboardController.deleteQuestion);

// --- Users Management ---
router.get("/users", dashboardController.getAllUsers);

export default router;
