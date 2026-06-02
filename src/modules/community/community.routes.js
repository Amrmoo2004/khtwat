import { Router } from "express";
import * as communityServices from './community.services.js';

const router = Router();

// Posts routes
router.post("/posts", communityServices.createPost);
router.get("/posts", communityServices.getPaginatedPosts);
router.get("/posts/:id", communityServices.getPostById);
router.delete("/posts/:id", communityServices.deletePost);

// Like toggle
router.put("/posts/:id/like", communityServices.toggleLike);

// Comments routes
router.post("/posts/:id/comments", communityServices.addComment);
router.get("/posts/:id/comments", communityServices.getPostComments);

export default router;
