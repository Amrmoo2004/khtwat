import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, { timestamps: true });

// Middleware to update commentsCount in Post after a new comment is saved
commentSchema.post('save', async function() {
    await mongoose.model('Post').findByIdAndUpdate(this.postId, {
        $inc: { commentsCount: 1 }
    });
});

// Middleware to update commentsCount in Post after a comment is removed
commentSchema.post('findOneAndDelete', async function(doc) {
    if (doc) {
        await mongoose.model('Post').findByIdAndUpdate(doc.postId, {
            $inc: { commentsCount: -1 }
        });
    }
});

export const CommentModel = mongoose.model('Comment', commentSchema);
