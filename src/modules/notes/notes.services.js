import mongoose from 'mongoose';
import { NoteModel } from "../DB/models/notes.model.js"; 

export const createNote = async (req, res, next) => {
    try {
        const { title, content } = req.body;
        const userId = req.user?.id || req.body.userId; // Allow userId from body for testing

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required. Please provide userId in request body or use authentication.' });
        }

        const note = await NoteModel.create({
            title,
            content,
            userId
        });

        res.status(201).json({
            message: 'Note created successfully',
            note
        });
    } catch (err) {
        console.error('Error creating note:', err);
        res.status(500).json({ message: 'Error creating note', error: err.message });
    }
};

export const updateNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const userId = req.user?.id || req.body.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Find note by ID and verify ownership
        const note = await NoteModel.findOne({ _id: id, userId });
        if (!note) {
            return res.status(404).json({ message: 'Note not found or you are not the owner' });
        }

        const updatedNote = await NoteModel.findByIdAndUpdate(
            id,
            { title, content },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: 'Note updated',
            note: updatedNote
        });
    } catch (err) {
        console.error('Error updating note:', err);
        res.status(500).json({ message: 'Error updating note', error: err.message });
    }
};

export const replaceNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const userId = req.user?.id || req.body.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const note = await NoteModel.findOne({ _id: id, userId });
        if (!note) {
            return res.status(404).json({ message: 'Note not found or you are not the owner' });
        }

        const replacedNote = await NoteModel.findOneAndReplace(
            { _id: id },
            { title, content, userId },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: 'Note replaced',
            note: replacedNote
        });
    } catch (err) {
        console.error('Error replacing note:', err);
        res.status(500).json({ message: 'Error replacing note', error: err.message });
    }
};

export const updateAllNotes = async (req, res, next) => {
    try {
        const { title } = req.body;
        const userId = req.user?.id || req.body.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        await NoteModel.updateMany({ userId }, { title });

        res.status(200).json({
            message: 'All notes updated'
        });
    } catch (err) {
        console.error('Error updating all notes:', err);
        res.status(500).json({ message: 'Error updating all notes', error: err.message });
    }
};

export const deleteNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.body.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const note = await NoteModel.findOneAndDelete({ _id: id, userId });
        if (!note) {
            return res.status(404).json({ message: 'Note not found or you are not the owner' });
        }

        res.status(200).json({
            message: 'Note deleted',
            note
        });
    } catch (err) {
        console.error('Error deleting note:', err);
        res.status(500).json({ message: 'Error deleting note', error: err.message });
    }
};

export const getPaginatedNotes = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user?.id || req.query.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const notes = await NoteModel.find({ userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.status(200).json(notes);
    } catch (err) {
        console.error('Error getting paginated notes:', err);
        res.status(500).json({ message: 'Error getting notes', error: err.message });
    }
};

export const getNoteById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.query.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const note = await NoteModel.findOne({ _id: id, userId });
        if (!note) {
            return res.status(404).json({ 
                message: 'Note not found or you are not the owner' 
            });
        }

        res.status(200).json(note);
    } catch (err) {
        console.error('Error getting note by ID:', err);
        res.status(500).json({ message: 'Error getting note', error: err.message });
    }
};

export const getNoteByContent = async (req, res, next) => {
    try {
        const { content } = req.query;
        const userId = req.user?.id || req.query.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        if (!content) {
            return res.status(400).json({ message: 'Please provide content to search' });
        }

        const notes = await NoteModel.find({ 
            userId, 
            content: { $regex: content, $options: 'i' } 
        });

        res.status(200).json(notes);
    } catch (err) {
        console.error('Error searching notes by content:', err);
        res.status(500).json({ message: 'Error searching notes', error: err.message });
    }
};

export const getNotesWithUser = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.query.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const notes = await NoteModel.find({ userId })
            .select('title userId createdAt')
            .populate({
                path: 'userId',
                select: 'email'
            });

        res.status(200).json(notes);
    } catch (err) {
        console.error('Error getting notes with user:', err);
        res.status(500).json({ message: 'Error getting notes', error: err.message });
    }
};

export const getNotesAggregate = async (req, res, next) => {
    try {
        const { title } = req.query;
        const userId = req.user?.id || req.query.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const matchStage = { userId: new mongoose.Types.ObjectId(userId) };
        if (title) {
            matchStage.title = { $regex: title, $options: 'i' };
        }

        const notes = await NoteModel.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    title: 1,
                    createdAt: 1,
                    'user.name': 1,
                    'user.email': 1
                }
            }
        ]);

        res.status(200).json(notes);
    } catch (err) {
        console.error('Error getting aggregated notes:', err);
        res.status(500).json({ message: 'Error getting notes', error: err.message });
    }
};

export const deleteAllNotes = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.body.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        await NoteModel.deleteMany({ userId });

        res.status(200).json({
            message: 'All notes deleted'
        });
    } catch (err) {
        console.error('Error deleting all notes:', err);
        res.status(500).json({ message: 'Error deleting notes', error: err.message });
    }
};