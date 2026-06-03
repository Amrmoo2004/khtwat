import axios from 'axios';
import { ExamSessionModel } from '../DB/models/examSession.model.js';
import { QuestionModel } from '../DB/models/question.model.js';

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

export const startExam = async (req, res) => {
    try {
        const { subjects, max_questions = 20, target_se = 0.3 } = req.body;
        // User ID comes from the JWT token via the auth middleware
        const userId = req.user.id;

        if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
            return res.status(400).json({ message: "Please provide an array of 'subjects'." });
        }

        const upperSubjects = subjects.map(s => s.toUpperCase());

        // 1. Fetch all questions for these subjects from MongoDB
        const questions = await QuestionModel.find({ subject: { $in: upperSubjects } });
        
        if (!questions || questions.length === 0) {
            return res.status(404).json({ message: `No questions found for subjects: ${upperSubjects.join(', ')}` });
        }

        // 2. Call Python AI to initialize the session and get the first question
        const aiResponse = await axios.post(`${PYTHON_AI_URL}/exam/start`, {
            subjects: upperSubjects,
            max_questions,
            target_se,
            user_id: userId,
            questions: questions.map(q => ({
                question_id: q.question_id,
                content: {
                    question_text: q.text,
                    question_type: "MCQ",
                    options: [
                        { id: 'A', text: q.options.A },
                        { id: 'B', text: q.options.B },
                        { id: 'C', text: q.options.C },
                        { id: 'D', text: q.options.D }
                    ],
                    correct_answer: q.correct_answer
                },
                metadata: { subject: q.subject },
                irt_parameters: {
                    a: q.irt_parameters.discrimination_a,
                    b: q.irt_parameters.difficulty_b,
                    c: 0.25 // Default guessing factor
                }
            }))
        });

        const { session_id, first_question, total_available } = aiResponse.data;

        // 3. Create a new Exam Session in MongoDB
        const newSession = new ExamSessionModel({
            studentId: userId,
            subjects: upperSubjects,
            status: 'active',
            responses: []
        });
        
        // We temporarily store the Python session_id in the _id or just return it to the client
        // Wait, Python generates a string session_id, Mongoose _id is ObjectId.
        // Let's add python_session_id to ExamSessionModel, or use it as a custom field.
        // To be safe without altering the schema if it's strict, we can just return it. 
        // Oh wait, the user's examSession schema didn't have python_session_id.
        // Let's save the MongoDB _id and use it, but Python generates its own. 
        // We will pass the Python session_id back to the client.
        
        await newSession.save();

        return res.status(200).json({
            exam_session_id: newSession._id, // MongoDB ID
            python_session_id: session_id,   // Python AI Session ID
            first_question,
            total_available
        });

    } catch (error) {
        console.error("Error starting exam:", error.response?.data || error.message);
        res.status(500).json({ message: "Failed to start exam", error: error.message });
    }
};

export const submitAnswer = async (req, res) => {
    try {
        const { exam_session_id, python_session_id, question_id, user_answer, time_taken_seconds = 60 } = req.body;

        // 1. Call Python AI to submit the answer and get next question or result
        const aiResponse = await axios.post(`${PYTHON_AI_URL}/exam/answer`, {
            session_id: python_session_id,
            question_id: question_id,
            user_answer: user_answer
        });

        const aiData = aiResponse.data;

        // 2. Find the ExamSession in MongoDB
        const session = await ExamSessionModel.findById(exam_session_id);
        if (!session) {
            return res.status(404).json({ message: "Exam session not found in DB" });
        }

        // 3. Add the response to the DB
        session.responses.push({
            question_id,
            user_answer,
            is_correct: aiData.is_correct,
            theta_after: aiData.new_theta,
            time_taken_seconds
        });

        // 4. Check if the exam is finished
        if (aiData.is_finished) {
            session.status = 'completed';
            
            // Call Python to get the final result receipt
            const receiptResponse = await axios.get(`${PYTHON_AI_URL}/exam/result/${python_session_id}`);
            const receipt = receiptResponse.data;

            session.final_result = {
                estimated_theta: receipt.final_theta,
                standard_error: receipt.final_se,
                total_questions: receipt.total_questions,
                per_subject_thetas: receipt.per_subject_thetas || {},
                exam_receipt: receipt
            };
            
            await session.save();
            return res.status(200).json({ 
                is_finished: true, 
                message: aiData.finish_reason,
                result: session.final_result 
            });
        }

        // 5. If not finished, just save and return next question
        await session.save();
        
        return res.status(200).json({
            is_finished: false,
            current_theta: aiData.new_theta,
            next_question: aiData.next_question
        });

    } catch (error) {
        console.error("Error submitting answer:", error.response?.data || error.message);
        res.status(500).json({ message: "Failed to submit answer", error: error.message });
    }
};
