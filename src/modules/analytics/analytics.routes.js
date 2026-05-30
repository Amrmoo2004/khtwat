import { Router } from "express";
import * as analyticsController from './analytics.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

// Get analytics for the logged-in student
router.get("/student", authenticateToken, analyticsController.getStudentAnalytics);

// Get admin system-wide analytics (can add an isAdmin middleware here later)
router.get("/admin", authenticateToken, analyticsController.getAdminAnalytics);

export default router;
