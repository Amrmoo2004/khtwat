import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function runTest() {
    console.log("🚀 Starting Full E2E Exam Test...");
    let token = '';
    
    // 1. Signup / Login
    try {
        console.log("📝 Attempting to register a test student...");
        const signupRes = await axios.post(`${API_URL}/auth/signup`, {
            name: 'Test Student',
            email: 'test' + Date.now() + '@example.com',
            password: 'password123',
            phone: '01000000000',
            age: 18
        });
        token = signupRes.data.token;
        console.log("✅ Registered successfully!");
    } catch (err) {
        console.error("❌ Signup failed:", err.response?.data || err.message);
        return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Start Exam
    let exam_session_id = '';
    let python_session_id = '';
    let current_question = null;

    try {
        console.log("\n▶️ Starting ARABIC Exam...");
        const startRes = await axios.post(`${API_URL}/exam/start`, { subject: 'ARABIC', max_questions: 10 }, { headers });
        exam_session_id = startRes.data.exam_session_id;
        python_session_id = startRes.data.python_session_id;
        current_question = startRes.data.first_question;
        console.log(`✅ Exam started! Session IDs => Node: ${exam_session_id}, Python: ${python_session_id}`);
    } catch (err) {
        console.error("❌ Start Exam failed:", err.response?.data || err.message);
        return;
    }

    // 3. Loop answering questions
    let is_finished = false;
    let questionNumber = 1;

    while (!is_finished && current_question) {
        console.log(`\n❓ Question ${questionNumber}: ${current_question.text}`);
        const options = Object.keys(current_question.options);
        // Pick a random option (e.g. A, B, C, D)
        const randomAnswer = options[Math.floor(Math.random() * options.length)];
        console.log(`👉 Student selected: ${randomAnswer}`);

        try {
            const submitRes = await axios.post(`${API_URL}/exam/submit-answer`, {
                exam_session_id,
                python_session_id,
                question_id: current_question.question_id,
                user_answer: randomAnswer,
                time_taken_seconds: 15
            }, { headers });

            is_finished = submitRes.data.is_finished;
            
            if (!is_finished) {
                current_question = submitRes.data.next_question;
                questionNumber++;
            } else {
                console.log("\n🎉 EXAM FINISHED!");
                console.log("Final Result:", JSON.stringify(submitRes.data.result, null, 2));
            }
        } catch (err) {
            console.error("❌ Submit Answer failed:", err.response?.data || err.message);
            break;
        }
    }

    // 4. Test Analytics
    try {
        console.log("\n📊 Fetching Student Analytics...");
        const analyticsRes = await axios.get(`${API_URL}/analytics/student`, { headers });
        console.log("Student Dashboard:", JSON.stringify(analyticsRes.data, null, 2));
    } catch (err) {
        console.error("❌ Analytics failed:", err.response?.data || err.message);
    }
}

runTest();
