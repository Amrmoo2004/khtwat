import time
import numpy as np
from datetime import datetime, timezone

from ai.irt_engine import IRTEngine2PL

class ExamService:
    """
    Stateless AI Service that acts as a math engine.
    Holds sessions in-memory temporarily during the exam.
    Does NOT use any database (No Supabase).
    """
    
    # In-memory session cache for active exams (maps session_id -> engine state)
    _active_sessions = {}
    
    @classmethod
    def start_exam(cls, user_id: str, subject: str, questions: list, max_questions: int = 20, target_se: float = 0.3):
        """Initialize a new adaptive exam session."""
        if not questions:
            raise ValueError(f"No questions provided for subject '{subject}'")
            
        session_id = f"SESSION_{user_id[:8]}_{int(time.time())}"
        
        # Initialize engine state (Start with -1.0 so the first question is easy)
        engine_state = {
            "theta": -1.0,
            "questions": {q["question_id"]: q for q in questions},
            "unasked": {q["question_id"]: q for q in questions},
            "history_questions": [],
            "history_responses": [],
            "history_a": [],
            "history_b": [],
            "history_c": [],
            "max_questions": max_questions,
            "target_se": target_se,
            "start_time": time.time(),
            "current_question": None,
            "current_question_start": None,
            "subject": subject,
            "user_id": user_id
        }
        
        cls._active_sessions[session_id] = engine_state
        
        # Get first question
        first_q = cls._select_next_question(engine_state)
        engine_state["current_question"] = first_q
        engine_state["current_question_start"] = time.time()
        
        return session_id, first_q, len(questions)
    
    @classmethod
    def _select_next_question(cls, state: dict, exposure_pool_size: int = 5):
        """Select the next question using Fisher Information maximization."""
        if not state["unasked"]:
            return None
        
        theta = state["theta"]
        info_scores = []
        
        for qid, q in state["unasked"].items():
            a = q["irt_parameters"]["a"]
            b = q["irt_parameters"]["b"]
            c = q["irt_parameters"].get("c", 0.0)
            p = IRTEngine2PL.probability(theta, a, b, c)
            q_val = 1.0 - p
            
            if c > 0:
                p_star = (p - c) / (1.0 - c)
                info = (a ** 2) * (p_star ** 2) * q_val / max(p, 1e-10)
            else:
                info = (a ** 2) * p * q_val
            
            info_scores.append((info, qid))
        
        info_scores.sort(key=lambda x: x[0], reverse=True)
        
        import random
        top = info_scores[:min(exposure_pool_size, len(info_scores))]
        _, selected_qid = random.choice(top)
        
        return state["unasked"][selected_qid]
    
    @classmethod
    def submit_answer(cls, session_id: str, question_id: str, user_answer: str, time_per_question: int = 60):
        """Submit an answer and update theta."""
        if session_id not in cls._active_sessions:
            raise ValueError("Session not found or expired")
        
        state = cls._active_sessions[session_id]
        
        if state["current_question"] is None or state["current_question"]["question_id"] != question_id:
            raise ValueError("Invalid question submission")
        
        q = state["current_question"]
        a = q["irt_parameters"]["a"]
        b = q["irt_parameters"]["b"]
        c = q["irt_parameters"].get("c", 0.0)
        correct_answer = q["content"]["correct_answer"]
        
        end_time = time.time()
        time_spent = end_time - state["current_question_start"]
        
        # Timeout check
        is_timeout = False
        if time_per_question > 0 and time_spent > time_per_question:
            is_timeout = True
            is_correct = False
        else:
            is_correct = user_answer.strip().upper() == correct_answer.strip().upper()
        
        # Update state
        state["unasked"].pop(question_id, None)
        state["history_questions"].append(question_id)
        state["history_responses"].append(1 if is_correct else 0)
        state["history_a"].append(a)
        state["history_b"].append(b)
        state["history_c"].append(c)
        
        # Update theta
        state["theta"] = float(IRTEngine2PL.estimate_ability(
            np.array(state["history_responses"]),
            np.array(state["history_a"]),
            np.array(state["history_b"]),
            np.array(state["history_c"]),
            initial_theta=state["theta"]
        ))
        
        # Calculate SE
        total_info = sum(
            cls._item_info(state["theta"], aa, bb, cc)
            for aa, bb, cc in zip(state["history_a"], state["history_b"], state["history_c"])
        )
        current_se = 1.0 / np.sqrt(total_info) if total_info > 0 else float('inf')
        
        # Check if finished
        num_asked = len(state["history_questions"])
        is_finished = False
        finish_reason = None
        
        if num_asked >= state["max_questions"]:
            is_finished = True
            finish_reason = "Max questions reached"
        elif num_asked >= 5 and current_se <= state["target_se"]:
            is_finished = True
            finish_reason = f"Target precision reached (SE: {current_se:.3f})"
        elif not state["unasked"]:
            is_finished = True
            finish_reason = "Bank exhausted"
        
        # Get next question if not finished
        next_question = None
        if not is_finished:
            next_question = cls._select_next_question(state)
            state["current_question"] = next_question
            state["current_question_start"] = time.time()
        else:
            state["current_question"] = None
        
        return {
            "is_correct": is_correct,
            "is_timeout": is_timeout,
            "new_theta": state["theta"],
            "current_se": current_se,
            "is_finished": is_finished,
            "finish_reason": finish_reason,
            "next_question": next_question
        }
    
    @classmethod
    def finish_exam(cls, session_id: str):
        """Finalize an exam session and generate results."""
        if session_id not in cls._active_sessions:
            raise ValueError("Session not found")
        
        state = cls._active_sessions[session_id]
        end_time = time.time()
        
        total_q = len(state["history_questions"])
        correct = sum(state["history_responses"])
        
        total_info = sum(
            cls._item_info(state["theta"], a, b, c)
            for a, b, c in zip(state["history_a"], state["history_b"], state["history_c"])
        )
        final_se = 1.0 / np.sqrt(total_info) if total_info > 0 else float('inf')
        
        result = {
            "session_id": session_id,
            "subject": state["subject"],
            "total_questions": total_q,
            "correct_answers": correct,
            "raw_percentage": round((correct / total_q * 100) if total_q > 0 else 0, 2),
            "final_theta": round(state["theta"], 4),
            "final_se": round(final_se, 4),
            "start_time": datetime.fromtimestamp(state["start_time"], tz=timezone.utc).isoformat(),
            "end_time": datetime.fromtimestamp(end_time, tz=timezone.utc).isoformat(),
            "duration_seconds": round(end_time - state["start_time"], 2)
        }
        
        # Clean up in-memory state
        del cls._active_sessions[session_id]
        
        return result
    
    @staticmethod
    def _item_info(theta, a, b, c=0.0):
        """Calculate Fisher Information for a single item."""
        p = IRTEngine2PL.probability(theta, a, b, c)
        q = 1.0 - p
        if c > 0:
            p_star = (p - c) / (1.0 - c)
            return (a ** 2) * (p_star ** 2) * q / max(p, 1e-10)
        return (a ** 2) * p * q
