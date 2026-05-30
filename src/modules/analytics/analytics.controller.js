import { ExamSessionModel } from '../DB/models/examSession.model.js';
import { QuestionModel } from '../DB/models/question.model.js';
import { AntiCheatLogModel } from '../DB/models/antiCheatLog.model.js';
import { UserModel } from '../DB/models/user.model.js';

export const getStudentAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all completed sessions for this user
        const sessions = await ExamSessionModel.find({ studentId: userId, status: 'completed' })
            .sort({ createdAt: -1 });

        const subjectStats = {};
        let total_exams = 0;
        let theta_sum = 0;

        for (const session of sessions) {
            total_exams++;
            const subj = session.subject;
            
            if (!subjectStats[subj]) {
                subjectStats[subj] = {
                    subject: subj,
                    latest_theta: session.final_result?.estimated_theta || 0,
                    total_exams: 0,
                    total_questions: 0,
                    total_correct: 0,
                };
            }
            
            subjectStats[subj].total_exams += 1;
            subjectStats[subj].total_questions += session.responses.length;
            subjectStats[subj].total_correct += session.responses.filter(r => r.is_correct).length;
            
            // Assuming the first session we encounter is the latest because of sort
            // And we just add its theta to average
            theta_sum += session.final_result?.estimated_theta || 0;
        }

        const subjects_data = Object.values(subjectStats).map(stat => ({
            ...stat,
            accuracy: stat.total_questions > 0 ? Number(((stat.total_correct / stat.total_questions) * 100).toFixed(1)) : 0
        }));

        const strengths = subjects_data.filter(s => s.latest_theta > 0.5).map(s => s.subject);
        const weaknesses = subjects_data.filter(s => s.latest_theta < -0.5).map(s => s.subject);
        const overall_theta = total_exams > 0 ? Number((theta_sum / total_exams).toFixed(4)) : null;

        return res.status(200).json({
            user_id: userId,
            subjects: subjects_data,
            overall_theta,
            total_exams,
            strengths,
            weaknesses,
            recent_sessions: sessions.slice(0, 20)
        });
    } catch (error) {
        console.error("Error fetching student analytics:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getAdminAnalytics = async (req, res) => {
    try {
        // Total counts
        const total_students = await UserModel.countDocuments();
        const total_exams = await ExamSessionModel.countDocuments({ status: 'completed' });
        const total_questions = await QuestionModel.countDocuments();

        // Hardest and easiest questions based on irt_b
        const hardest_questions = await QuestionModel.find()
            .sort({ 'irt_parameters.difficulty_b': -1 })
            .limit(10)
            .select('question_id text subject irt_parameters');

        const easiest_questions = await QuestionModel.find()
            .sort({ 'irt_parameters.difficulty_b': 1 })
            .limit(10)
            .select('question_id text subject irt_parameters');

        // Top students (latest high theta)
        const top_students = await ExamSessionModel.find({ status: 'completed' })
            .sort({ 'final_result.estimated_theta': -1 })
            .limit(10)
            .populate('studentId', 'name email');

        // Cheating alerts
        const cheating_alerts = await AntiCheatLogModel.find({ risk_score: { $gt: 50 } })
            .sort({ timestamp: -1 })
            .limit(20)
            .populate('session_id');

        return res.status(200).json({
            total_students,
            total_exams,
            total_questions,
            hardest_questions,
            easiest_questions,
            top_students,
            cheating_alerts
        });
    } catch (error) {
        console.error("Error fetching admin analytics:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
