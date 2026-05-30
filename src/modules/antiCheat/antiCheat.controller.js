import { AntiCheatLogModel } from '../DB/models/antiCheatLog.model.js';
import { ExamSessionModel } from '../DB/models/examSession.model.js';

const RISK_SCORES = {
    "tab_switch": 15,
    "copy_paste": 25,
    "fullscreen_exit": 20,
    "right_click": 5,
    "devtools_open": 40,
    "abnormal_timing": 30,
    "webcam_face_missing": 35,
    "webcam_multiple_faces": 45,
    "answer_similarity": 50
};

export const logAntiCheatEvent = async (req, res) => {
    try {
        const { session_id, event_type, event_data } = req.body;
        
        // Find the exam session
        const session = await ExamSessionModel.findById(session_id);
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        const risk = RISK_SCORES[event_type] || 10;

        // Create log
        const log = new AntiCheatLogModel({
            session_id,
            event_type,
            event_data,
            risk_score: risk
        });
        await log.save();

        // Calculate cumulative risk
        const allLogs = await AntiCheatLogModel.find({ session_id });
        const totalRisk = allLogs.reduce((acc, curr) => acc + curr.risk_score, 0);
        const cumulative_risk = Math.min(totalRisk, 100); // Cap at 100

        return res.status(200).json({
            logged: true,
            event_risk: risk,
            cumulative_risk,
            alert: cumulative_risk > 70
        });

    } catch (error) {
        console.error("Error logging anti-cheat event:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getSessionRisk = async (req, res) => {
    try {
        const { session_id } = req.params;

        const session = await ExamSessionModel.findById(session_id);
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        const logs = await AntiCheatLogModel.find({ session_id }).sort({ timestamp: 1 });
        
        const totalRisk = logs.reduce((acc, curr) => acc + curr.risk_score, 0);
        
        const event_counts = {};
        for (const log of logs) {
            event_counts[log.event_type] = (event_counts[log.event_type] || 0) + 1;
        }

        return res.status(200).json({
            session_id,
            total_events: logs.length,
            cumulative_risk: Math.min(totalRisk, 100),
            event_breakdown: event_counts,
            events: logs,
            is_suspicious: totalRisk > 50
        });

    } catch (error) {
        console.error("Error fetching session risk:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
