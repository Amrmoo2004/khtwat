import { Router } from "express";
const router = Router();

import * as notesServices from './notes.services.js';
router.post("/", notesServices.createNote);
router.patch("/:id", notesServices.updateNote);
router.put("/replace/:id", notesServices.replaceNote);
router.patch("/update/all", notesServices.updateAllNotes);
router.delete("/:id",notesServices. deleteNote);
router.get("/paginated", notesServices.getPaginatedNotes);
router.get("/:id", notesServices.getNoteById);
router.get("/search/content", notesServices.getNoteByContent);
router.get("/with-user",notesServices. getNotesWithUser);
router.get("/aggregate",notesServices. getNotesAggregate);
router.delete("/", notesServices.deleteAllNotes);

export default router;