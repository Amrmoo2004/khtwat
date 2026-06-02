import { Router } from "express";
import * as communityServices from './community.services.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

// Posts routes
router.post("/posts", authenticateToken, communityServices.createPost);
router.get("/posts", communityServices.getPaginatedPosts);
router.get("/posts/:id", communityServices.getPostById);
router.delete("/posts/:id", authenticateToken, communityServices.deletePost);

// Like toggle
router.put("/posts/:id/like", authenticateToken, communityServices.toggleLike);

// Comments routes
router.post("/posts/:id/comments", authenticateToken, communityServices.addComment);
router.get("/posts/:id/comments", communityServices.getPostComments);

export default router;
