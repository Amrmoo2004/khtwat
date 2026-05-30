import { Router } from "express";
import * as authservices from './auth.services.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

// Public Auth routes
router.post("/login", authservices.login);
router.post("/signup", authservices.signup);

// Protected User management routes
router.put("/update", authenticateToken, authservices.updateUser);
router.delete("/delete", authenticateToken, authservices.deleteUser);
router.get("/profile", authenticateToken, authservices.getUser);

export default router; 