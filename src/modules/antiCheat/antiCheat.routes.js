import { Router } from "express";
import * as antiCheatController from './antiCheat.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

// Log an anti-cheat event
router.post("/event", authenticateToken, antiCheatController.logAntiCheatEvent);

// Get session risk summary
router.get("/session/:session_id", authenticateToken, antiCheatController.getSessionRisk);

export default router;
