import { Router } from "express";
import * as recommendationsController from './recommendations.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

// Get full AI recommendations (short term, long term, and track prediction)
router.get("/", authenticateToken, recommendationsController.getRecommendations);

// Get just the AI track prediction
router.get("/track", authenticateToken, recommendationsController.getTrackPrediction);

export default router;
