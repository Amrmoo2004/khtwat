import mongoose from 'mongoose';

const AntiCheatLogSchema = new mongoose.Schema({
    session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamSession', required: true },
    event_type: { type: String, required: true },
    event_data: { type: Object, default: {} },
    risk_score: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

export const AntiCheatLogModel = mongoose.model('AntiCheatLog', AntiCheatLogSchema);
