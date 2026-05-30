import mongoose from "mongoose";
const { Schema } = mongoose;

const examSessionSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    responses: [{
        question_id: String,
        user_answer: String,
        is_correct: Boolean,
        theta_after: Number,
        time_taken_seconds: Number
    }],
    final_result: {
        estimated_theta: Number,
        standard_error: Number,
        total_questions: Number,
        exam_receipt: Object 
    }
}, { timestamps: true });

export const ExamSessionModel = mongoose.model('ExamSession', examSessionSchema);
