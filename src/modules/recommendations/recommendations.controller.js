import axios from 'axios';
import { ExamSessionModel } from '../DB/models/examSession.model.js';

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

/**
 * Build subject_thetas map from completed exam sessions.
 * 
 * Priority order for each subject's theta:
 * 1. per_subject_thetas (computed by Python AI per subject) — most accurate
 * 2. estimated_theta shared across all subjects in the session — fallback
 * 
 * Only the latest theta per subject is kept (sessions are sorted newest-first).
 */
function buildSubjectThetas(sessions) {
    const subject_thetas = {};

    for (const session of sessions) {
        if (!session.final_result) continue;

        // Priority 1: Use per_subject_thetas if available (new multi-subject sessions)
        const perSubject = session.final_result.per_subject_thetas;
        if (perSubject && (perSubject instanceof Map ? perSubject.size > 0 : Object.keys(perSubject).length > 0)) {
            const entries = perSubject instanceof Map ? perSubject.entries() : Object.entries(perSubject);
            for (const [subj, theta] of entries) {
                if (!subj || subj === 'undefined' || theta == null) continue;
                const key = subj.toUpperCase();
                if (subject_thetas[key] === undefined) {
                    subject_thetas[key] = theta;
                }
            }
            continue; // per_subject_thetas covers this session fully
        }

        // Priority 2: Fallback to shared estimated_theta for old sessions
        if (session.final_result.estimated_theta == null) continue;
        const theta = session.final_result.estimated_theta;

        // Support both old schema (subject) and new schema (subjects)
        let subjectList = [];
        if (session.subjects && Array.isArray(session.subjects) && session.subjects.length > 0) {
            subjectList = session.subjects;
        } else if (session.subject) {
            subjectList = [session.subject];
        }

        for (const subj of subjectList) {
            if (!subj || subj === 'undefined') continue;
            const key = subj.toUpperCase();
            if (subject_thetas[key] === undefined) {
                subject_thetas[key] = theta;
            }
        }
    }

    return subject_thetas;
}

export const getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch completed sessions to get latest thetas per subject
        const sessions = await ExamSessionModel.find({ studentId: userId, status: 'completed' })
            .sort({ createdAt: -1 });

        const subject_thetas = buildSubjectThetas(sessions);

        if (Object.keys(subject_thetas).length === 0) {
            return res.status(200).json({
                short_term: [],
                long_term: [],
                predicted_track: null,
                track_confidence: null,
                message: "Take exams in multiple subjects to get personalized recommendations."
            });
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

        const subject_thetas = buildSubjectThetas(sessions);

        if (Object.keys(subject_thetas).length === 0) {
            return res.status(200).json({
                predicted_track: null,
                confidence: 0,
                message: "Insufficient data. Take exams first."
            });
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

