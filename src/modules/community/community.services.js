import { PostModel } from '../DB/models/post.model.js';
import { CommentModel } from '../DB/models/comment.model.js';
import mongoose from 'mongoose';

// ========================
// POSTS
// ========================

export const createPost = async (req, res, next) => {
    try {
        const { content, tags } = req.body;
        const userId = req.user?.id || req.body.userId; // Fallback for testing

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const post = await PostModel.create({
            userId,
            content,
            tags: tags || []
        });

        res.status(201).json({
            message: 'Post created successfully',
            post
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Error creating post', error: error.message });
    }
};

export const getPaginatedPosts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const posts = await PostModel.find()
            .populate('userId', 'email name') // Adjust fields based on User model
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
            
        const total = await PostModel.countDocuments();

        res.status(200).json({
            posts,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error getting posts:', error);
        res.status(500).json({ message: 'Error getting posts', error: error.message });
    }
};

export const getPostById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await PostModel.findById(id).populate('userId', 'email name');
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        res.status(200).json({ post });
    } catch (error) {
        console.error('Error getting post:', error);
        res.status(500).json({ message: 'Error getting post', error: error.message });
    }
};

export const deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.body.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const post = await PostModel.findOneAndDelete({ _id: id, userId });
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found or you are not the owner' });
        }

        // Optional: Also delete all comments associated with this post
        await CommentModel.deleteMany({ postId: id });

        res.status(200).json({ message: 'Post deleted successfully', post });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Error deleting post', error: error.message });
    }
};

export const toggleLike = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.body.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const post = await PostModel.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const likeIndex = post.likes.indexOf(userId);
        
        if (likeIndex === -1) {
            // User hasn't liked it yet, so add the like
            post.likes.push(userId);
        } else {
            // User already liked it, so remove the like
            post.likes.splice(likeIndex, 1);
        }
        
        await post.save();
        
        res.status(200).json({
            message: likeIndex === -1 ? 'Post liked' : 'Post unliked',
            likesCount: post.likes.length,
            likes: post.likes
        });
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ message: 'Error toggling like', error: error.message });
    }
};

// ========================
// COMMENTS
// ========================

export const addComment = async (req, res, next) => {
    try {
        const { id } = req.params; // Post ID
        const { content } = req.body;
        const userId = req.user?.id || req.body.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const post = await PostModel.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = await CommentModel.create({
            postId: id,
            userId,
            content
        });

        res.status(201).json({
            message: 'Comment added successfully',
            comment
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Error adding comment', error: error.message });
    }
};

export const getPostComments = async (req, res, next) => {
    try {
        const { id } = req.params; // Post ID
        const { page = 1, limit = 10 } = req.query;

        const comments = await CommentModel.find({ postId: id })
            .populate('userId', 'email name')
            .sort({ createdAt: 1 }) // Older comments first usually makes sense
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.status(200).json({ comments });
    } catch (error) {
        console.error('Error getting comments:', error);
        res.status(500).json({ message: 'Error getting comments', error: error.message });
    }
};
