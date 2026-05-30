import mongoose from "mongoose";
const { Schema } = mongoose;

const questionSchema = new Schema({
    question_id: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    text: { type: String, required: true },
    options: { type: Object, required: true }, // e.g., { A: "1", B: "2", C: "3", D: "4" }
    correct_answer: { type: String, required: true },
    irt_parameters: {
        difficulty_b: { type: Number, required: true },
        discrimination_a: { type: Number, required: true }
    }
}, { timestamps: true });

export const QuestionModel = mongoose.model('Question', questionSchema);
