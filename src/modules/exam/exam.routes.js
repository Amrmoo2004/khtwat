import { Router } from "express";
import * as examController from './exam.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

// Endpoint to start a new exam (Protected)
router.post("/start", authenticateToken, examController.startExam);

// Endpoint to submit an answer (Protected)
router.post("/submit-answer", authenticateToken, examController.submitAnswer);

export default router;
