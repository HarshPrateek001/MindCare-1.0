import os
import logging
from typing import List, Dict, Any, Tuple, Optional
from groq import Groq # Import the Groq client library

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Initialize Groq client
try:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY environment variable not set.")
    groq_client = Groq(api_key=GROQ_API_KEY)
    logger.info("Groq client initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize Groq client: {e}. Please ensure GROQ_API_KEY is set correctly.")
    groq_client = None


class MentalHealthAI:
    """AI model wrapper to interact with the Groq API."""

    def __init__(self):
        """Initialize with emergency recommendations."""
        self.emergency_recommendations = [
            {"title": "Crisis Hotlines", "description": "National Suicide Prevention Lifeline: 988. Crisis Text Line: Text HOME to 741741."},
            {"title": "Professional Help", "description": "Contact a mental health professional or crisis counselor immediately."},
            {"title": "Support System", "description": "Reach out to trusted friends, family members, or support groups."},
            {"title": "Safety Planning", "description": "Work with a professional to create a safety plan for managing crisis situations."}
        ]

    def _is_severe_case(self, assessment_results: Dict[str, Any]) -> bool:
        """Check if any DASS-21 score indicates a severe or extremely severe case."""
        if not assessment_results:
            return False

        for category in ["depression", "anxiety", "stress"]:
            level = assessment_results.get(category, {}).get("level")
            if level in ["Severe", "Extremely Severe"]:
                return True
        return False

    def process_message(self, user_message: str, assessment_results: Optional[Dict[str, Any]] = None,
                        session_history: Optional[List[Dict[str, Any]]] = None) -> Tuple[str, bool, List[Dict[str, str]]]:
        """
        Process the user's message using the Groq API and determine session status.
        Simplified logic for should_end_session and recommendations.

        Args:
            user_message: The message from the user.
            assessment_results: DASS-21 assessment results if available.
            session_history: Previous messages in the session.

        Returns:
            Tuple of (response, should_end_session, recommendations).
        """
        response_content = "I am sorry, but the AI counselor is currently unavailable. Please try again later."
        should_end_session = False
        recommendations = []

        if not groq_client:
            logger.error("Groq client is not initialized. Cannot process message.")
            return response_content, should_end_session, recommendations

        messages = []
        system_prompt = (
            "You are MindCare, an empathetic and supportive AI mental health counselor. "
            "Your primary goal is to engage in compassionate dialogue, provide general emotional support, and offer helpful coping strategies within ethical boundaries. "
            "Always maintain a non-judgmental, warm, and understanding tone. Demonstrate active listening by reflecting on the user's feelings before offering guidance. "
            "Encourage users to explore their thoughts by asking open-ended questions. "
            "You **must not** provide medical diagnoses, clinical advice, or prescribe treatments. "
            "**If the user expresses suicidal ideation or intent for self-harm, immediately and prominently provide these emergency resources: National Suicide Prevention Lifeline: 988. Crisis Text Line: Text HOME to 741741. Then, strongly advise them to seek immediate professional help and suggest ending the session for their safety.** "
            "If the user's DASS-21 assessment indicates 'Severe' or 'Extremely Severe' levels in any category, acknowledge this sensitively (e.g., 'I understand you're experiencing a high level of anxiety based on your assessment...') and gently reinforce the importance of professional consultation. "
            "Keep responses concise and easy to understand. Your advice should be general and actionable, such as suggesting mindfulness, journaling, or connecting with support networks. Always prioritize safety and professional referral in severe cases."
        )
        
        if assessment_results:
            system_prompt += (
                f"\nUser's DASS-21 Assessment Results: Depression: {assessment_results.get('depression', {}).get('level')} ({assessment_results.get('depression', {}).get('score')}), "
                f"Anxiety: {assessment_results.get('anxiety', {}).get('level')} ({assessment_results.get('anxiety', {}).get('score')}), "
                f"Stress: {assessment_results.get('stress', {}).get('level')} ({assessment_results.get('stress', {}).get('score')})."
            )
            # Add a specific instruction if severe case detected based on assessment
            if self._is_severe_case(assessment_results):
                system_prompt += "\nUser has severe symptoms based on assessment. Prioritize encouragement for immediate professional help and suggest ending the session for their safety."
        messages.append({"role": "system", "content": system_prompt})

        # Add session history with validation
        if session_history:
            cleaned_session_history = []
            for msg in session_history:
                # Ensure each message is a dictionary and has 'role' and 'content' keys
                if isinstance(msg, dict) and "role" in msg and "content" in msg:
                    cleaned_session_history.append(msg)
                else:
                    logger.warning(f"Malformed message in session history, skipping: {msg}")
            messages.extend(cleaned_session_history)

        messages.append({"role": "user", "content": user_message})

        try:
            chat_completion = groq_client.chat.completions.create(
                messages=messages,
                model="llama3-8b-8192", # Or another suitable Groq model like "mixtral-8x7b-32768"
                temperature=0.7,
                max_tokens=500,
                top_p=1,
                stop=None,
                stream=False
            )

            response_content = chat_completion.choices[0].message.content

            user_message_lower = user_message.lower()

            # Logic for should_end_session and recommendations
            if any(term in user_message_lower for term in ["bye", "goodbye", "end session", "i want to stop"]):
                should_end_session = True
                logger.info("User explicitly requested to end session.")
            
            self_harm_keywords = ["harm myself", "kill myself", "suicide", "end my life", "hurt myself"]
            if any(keyword in user_message_lower for keyword in self_harm_keywords):
                should_end_session = True
                recommendations = self.emergency_recommendations
                logger.warning("Self-harm concern detected. Session flagged to end with emergency recommendations.")

        except Exception as e:
            logger.error(f"Error calling Groq API: {e}")
            response_content = "I'm sorry, I'm having trouble connecting to the AI counselor right now. Please try again later."
            should_end_session = False # Keep session open on API error

        return response_content, should_end_session, recommendations

# Create an instance of the AI model
ai_counselor = MentalHealthAI()

def generate_ai_response(user_message: str, assessment_results: Optional[Dict[str, Any]] = None,
                        session_history: Optional[List[Dict[str, Any]]] = None) -> Tuple[str, bool, List[Dict[str, str]]]:
    """
    Generate AI counselor response based on user message and assessment results.
    This function acts as a wrapper for the MentalHealthAI's process_message.
    """
    return ai_counselor.process_message(user_message, assessment_results, session_history)