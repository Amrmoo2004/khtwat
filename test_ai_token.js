import axios from 'axios';
import mongoose from 'mongoose';
import { QuestionModel } from './src/modules/DB/models/question.model.js';

const API_URL = 'http://localhost:3000';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMTdhMmZkNjBhZTQyZjA4OGVlNjY0ZiIsImVtYWlsIjoic3R1ZGVudEBleGFtcGxlLmNvbSIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzgwMTcwODE0LCJleHAiOjE3ODA3NzU2MTR9.gS8mRah6VrK6LYjUcJ75ElOKnvXrd2CNC-gdPn3o-5I';

async function runTest() {
    console.log("🚀 Starting Full E2E Exam Test with User Token...");
    
    // Connect to DB to look up the correct answers
    const mongoURI = 'mongodb+srv://amrmohamaf3_db_user:mimTM47x9VFf2pBN@cluster0.yibxlnu.mongodb.net/khtwat';
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to DB to simulate a smart student.");

    const headers = { Authorization: `Bearer ${USER_TOKEN}` };

    const subjects = ['ARABIC', 'MATH', 'ENGLISH'];
    
    for (const subject of subjects) {
        let exam_session_id = '';
        let python_session_id = '';
        let current_question = null;

        try {
            console.log(`\n========================================`);
            console.log(`▶️ Starting ${subject} Exam...`);
            const startRes = await axios.post(`${API_URL}/exam/start`, { subject: subject, max_questions: 10 }, { headers });
            exam_session_id = startRes.data.exam_session_id;
            python_session_id = startRes.data.python_session_id;
            current_question = startRes.data.first_question;
        } catch (err) {
            console.error(`❌ Start ${subject} Exam failed:`, err.response?.data || err.message);
            continue;
        }

        // 2. Loop answering questions for this subject
        let is_finished = false;
        let questionNumber = 1;

        while (!is_finished && current_question) {
            const qText = current_question.question_text || "Unknown question format";
            console.log(`\n❓ Question ${questionNumber}: ${qText}`);
            
            // Look up the correct answer from the database
            const dbQuestion = await QuestionModel.findOne({ question_id: current_question.question_id });
            let chosenAnswer = 'A'; // fallback
            
            if (dbQuestion) {
                // Simulate a smart student who gets it right 85% of the time
                const isSmart = Math.random() < 0.85;
                if (isSmart) {
                    chosenAnswer = dbQuestion.correct_answer;
                    console.log(`🧠 Smart Student knows the answer is: ${chosenAnswer}`);
                } else {
                    const options = ['A', 'B', 'C', 'D'];
                    chosenAnswer = options[Math.floor(Math.random() * options.length)];
                    console.log(`🤔 Student is guessing... chose: ${chosenAnswer}`);
                }
            }

            try {
                const submitRes = await axios.post(`${API_URL}/exam/submit-answer`, {
                    exam_session_id,
                    python_session_id,
                    question_id: current_question.question_id,
                    user_answer: chosenAnswer,
                    time_taken_seconds: 10
                }, { headers });

                is_finished = submitRes.data.is_finished;
                
                if (!is_finished) {
                    current_question = submitRes.data.next_question;
                    questionNumber++;
                } else {
                    console.log(`\n🎉 ${subject} EXAM FINISHED!`);
                    console.log(`📈 Score: ${submitRes.data.result.raw_percentage}%`);
                    console.log(`📊 AI Estimated Ability (Theta): ${submitRes.data.result.estimated_theta}`);
                }
            } catch (err) {
                console.error(`❌ Submit Answer failed for ${subject}:`, err.response?.data || err.message);
                break;
            }
        }
    }

    // 3. Test AI Recommendations
    try {
        console.log("\n========================================");
        console.log("📊 Fetching Final AI Recommendations...");
        const recRes = await axios.get(`${API_URL}/recommendations`, { headers });
        console.log("AI Recommendations:", JSON.stringify(recRes.data, null, 2));

        console.log("\n🎯 Fetching Final AI Track Prediction...");
        const trackRes = await axios.get(`${API_URL}/recommendations/track`, { headers });
        console.log("AI Track Prediction:", JSON.stringify(trackRes.data, null, 2));
    } catch (err) {
        console.error("❌ AI Fetch failed:", err.response?.data || err.message);
    }

    mongoose.disconnect();
}

runTest();
