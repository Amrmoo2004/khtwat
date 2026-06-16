import { UserModel } from "../DB/models/user.model.js";
import { QuestionModel } from "../DB/models/question.model.js";
import { ExamSessionModel } from "../DB/models/examSession.model.js";
import { AntiCheatLogModel } from "../DB/models/antiCheatLog.model.js";

// --- General Stats ---
export const getGeneralStats = async (req, res) => {
    try {
        const totalUsers = await UserModel.countDocuments({ role: 'student' });
        const totalAdmins = await UserModel.countDocuments({ role: 'admin' });
        const totalQuestions = await QuestionModel.countDocuments();
        const totalExamSessions = await ExamSessionModel.countDocuments();
        const activeExamSessions = await ExamSessionModel.countDocuments({ status: 'active' });
        const completedExamSessions = await ExamSessionModel.countDocuments({ status: 'completed' });
        const totalCheatLogs = await AntiCheatLogModel.countDocuments();

        res.status(200).json({
            users: {
                totalStudents: totalUsers,
                totalAdmins: totalAdmins
            },
            exams: {
                totalSessions: totalExamSessions,
                activeSessions: activeExamSessions,
                completedSessions: completedExamSessions
            },
            questions: {
                totalQuestions: totalQuestions
            },
            antiCheat: {
                totalLogs: totalCheatLogs
            }
        });
    } catch (error) {
        console.error("Error fetching general stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// --- Question Stats (Hardest Questions) ---
export const getQuestionStats = async (req, res) => {
    try {
        // Aggregate to find the hardest questions based on incorrect answers in completed sessions
        const hardestQuestions = await ExamSessionModel.aggregate([
            { $unwind: "$responses" },
            { $match: { "responses.is_correct": false } },
            { $group: {
                _id: "$responses.question_id",
                incorrectCount: { $sum: 1 }
            }},
            { $sort: { incorrectCount: -1 } },
            { $limit: 10 }
        ]);

        // Fetch question details for the hardest questions
        const questionIds = hardestQuestions.map(hq => hq._id);
        const questionsDetails = await QuestionModel.find({ question_id: { $in: questionIds } });

        const formattedStats = hardestQuestions.map(hq => {
            const details = questionsDetails.find(q => q.question_id === hq._id);
            return {
                question_id: hq._id,
                incorrectCount: hq.incorrectCount,
                subject: details?.subject,
                text: details?.text
            };
        });

        res.status(200).json({
            hardestQuestions: formattedStats
        });
    } catch (error) {
        console.error("Error fetching question stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// --- Questions Management ---
export const getAllQuestions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const questions = await QuestionModel.find().skip(skip).limit(limit);
        const total = await QuestionModel.countDocuments();

        res.status(200).json({
            questions,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalQuestions: total
        });
    } catch (error) {
        console.error("Error fetching questions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const addQuestion = async (req, res) => {
    try {
        const newQuestion = new QuestionModel(req.body);
        const savedQuestion = await newQuestion.save();
        res.status(201).json({ message: "Question added successfully", question: savedQuestion });
    } catch (error) {
        console.error("Error adding question:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Question ID already exists" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateQuestion = async (req, res) => {
    try {
        const { id } = req.params; // this is the _id or question_id depending on setup, let's assume it's the mongo _id
        const updatedQuestion = await QuestionModel.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        
        if (!updatedQuestion) {
            return res.status(404).json({ message: "Question not found" });
        }

        res.status(200).json({ message: "Question updated successfully", question: updatedQuestion });
    } catch (error) {
        console.error("Error updating question:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedQuestion = await QuestionModel.findByIdAndDelete(id);

        if (!deletedQuestion) {
            return res.status(404).json({ message: "Question not found" });
        }

        res.status(200).json({ message: "Question deleted successfully" });
    } catch (error) {
        console.error("Error deleting question:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// --- Users Management ---
export const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const users = await UserModel.find().select('-password').skip(skip).limit(limit);
        const total = await UserModel.countDocuments();

        res.status(200).json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalUsers: total
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
