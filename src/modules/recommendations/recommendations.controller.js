import axios from 'axios';
import { ExamSessionModel } from '../DB/models/examSession.model.js';

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

export const getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch completed sessions to get latest thetas per subject
        const sessions = await ExamSessionModel.find({ studentId: userId, status: 'completed' })
            .sort({ createdAt: -1 });

        const subject_thetas = {};

        for (const session of sessions) {
            const subj = session.subject;
            // Only take the latest theta for each subject
            if (subject_thetas[subj] === undefined && session.final_result) {
                subject_thetas[subj] = session.final_result.estimated_theta;
            }
        }

        // Call Python AI to generate recommendations
        const aiResponse = await axios.post(`${PYTHON_AI_URL}/recommendations/`, {
            subject_thetas
        });

        // The AI response returns short_term, long_term, predicted_track, track_confidence
        return res.status(200).json(aiResponse.data);

    } catch (error) {
        console.error("Error fetching recommendations:", error.response?.data || error.message);
        return res.status(500).json({ message: "Failed to get AI recommendations", error: error.message });
    }
};

export const getTrackPrediction = async (req, res) => {
    try {
        const userId = req.user.id;

        const sessions = await ExamSessionModel.find({ studentId: userId, status: 'completed' })
            .sort({ createdAt: -1 });

        const subject_thetas = {};

        for (const session of sessions) {
            const subj = session.subject;
            if (subject_thetas[subj] === undefined && session.final_result) {
                subject_thetas[subj] = session.final_result.estimated_theta;
            }
        }

        const aiResponse = await axios.post(`${PYTHON_AI_URL}/recommendations/track`, {
            subject_thetas
        });

        return res.status(200).json(aiResponse.data);

    } catch (error) {
        console.error("Error fetching track prediction:", error.response?.data || error.message);
        return res.status(500).json({ message: "Failed to get AI track prediction", error: error.message });
    }
};
