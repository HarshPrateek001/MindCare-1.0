import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

class SessionLogger:
    """Utility class for logging session data and analytics"""
    
    def __init__(self):
        self.session_data = {}
    
    def log_session_start(self, user_info: Dict[str, Any]) -> str:
        """Log the start of a new session"""
        session_id = f"session_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        self.session_data[session_id] = {
            "start_time": datetime.utcnow().isoformat(),
            "user_info": user_info,
            "messages": [],
            "assessment_results": None,
            "recommendations": [],
            "status": "active"
        }
        
        logger.info(f"Session started: {session_id} for user {user_info.get('email', 'unknown')}")
        return session_id
    
    def log_message(self, session_id: str, sender: str, message: str):
        """Log a message in the session"""
        if session_id in self.session_data:
            self.session_data[session_id]["messages"].append({
                "timestamp": datetime.utcnow().isoformat(),
                "sender": sender,
                "message": message
            })
    
    def log_assessment_results(self, session_id: str, results: Dict[str, Any]):
        """Log assessment results for a session"""
        if session_id in self.session_data:
            self.session_data[session_id]["assessment_results"] = results
            logger.info(f"Assessment completed for session {session_id}: {results}")
    
    def log_session_end(self, session_id: str, recommendations: List[Dict[str, str]]):
        """Log the end of a session"""
        if session_id in self.session_data:
            self.session_data[session_id]["end_time"] = datetime.utcnow().isoformat()
            self.session_data[session_id]["recommendations"] = recommendations
            self.session_data[session_id]["status"] = "completed"
            
            # Calculate session duration
            start_time = datetime.fromisoformat(self.session_data[session_id]["start_time"])
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds() / 60  # in minutes
            
            logger.info(f"Session ended: {session_id}, Duration: {duration:.1f} minutes, Messages: {len(self.session_data[session_id]['messages'])}")
    
    def get_session_data(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data by ID"""
        return self.session_data.get(session_id)
    
    def export_session_data(self, session_id: str) -> Optional[str]:
        """Export session data as JSON string"""
        session_data = self.get_session_data(session_id)
        if session_data:
            return json.dumps(session_data, indent=2)
        return None

class MentalHealthAnalytics:
    """Utility class for mental health analytics and insights"""
    
    @staticmethod
    def analyze_dass_scores(results: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze DASS-21 scores and provide insights"""
        analysis = {
            "overall_severity": "Normal",
            "primary_concern": None,
            "risk_level": "Low",
            "insights": []
        }
        
        scores = {
            "depression": results.get("depression", {}).get("score", 0),
            "anxiety": results.get("anxiety", {}).get("score", 0),
            "stress": results.get("stress", {}).get("score", 0)
        }
        
        # Determine overall severity
        max_score = max(scores.values())
        if max_score >= 28:
            analysis["overall_severity"] = "Extremely Severe"
            analysis["risk_level"] = "Very High"
        elif max_score >= 21:
            analysis["overall_severity"] = "Severe"
            analysis["risk_level"] = "High"
        elif max_score >= 14:
            analysis["overall_severity"] = "Moderate"
            analysis["risk_level"] = "Moderate"
        elif max_score >= 8:
            analysis["overall_severity"] = "Mild"
            analysis["risk_level"] = "Low"
        
        # Identify primary concern
        primary_concern = max(scores, key=scores.get)
        if scores[primary_concern] > 0:
            analysis["primary_concern"] = primary_concern
        
        # Generate insights
        insights = []
        
        if scores["depression"] >= 14:
            insights.append("Depression symptoms are significantly impacting daily functioning")
        
        if scores["anxiety"] >= 15:
            insights.append("Anxiety levels are in the severe range and may require immediate attention")
        
        if scores["stress"] >= 26:
            insights.append("Stress levels are very high and may be affecting physical health")
        
        # Check for comorbidity
        elevated_scores = sum(1 for score in scores.values() if score >= 14)
        if elevated_scores >= 2:
            insights.append("Multiple areas of concern detected - comprehensive treatment approach recommended")
        
        analysis["insights"] = insights
        
        return analysis
    
    @staticmethod
    def generate_treatment_priorities(analysis: Dict[str, Any]) -> List[str]:
        """Generate treatment priorities based on analysis"""
        priorities = []
        
        if analysis["risk_level"] in ["High", "Very High"]:
            priorities.append("Immediate professional intervention")
            priorities.append("Safety planning and crisis resources")
        
        if analysis["primary_concern"] == "depression":
            priorities.extend([
                "Mood stabilization techniques",
                "Behavioral activation strategies",
                "Sleep and routine optimization"
            ])
        elif analysis["primary_concern"] == "anxiety":
            priorities.extend([
                "Anxiety management techniques",
                "Relaxation and breathing exercises",
                "Gradual exposure therapy"
            ])
        elif analysis["primary_concern"] == "stress":
            priorities.extend([
                "Stress reduction strategies",
                "Time management and boundaries",
                "Physical wellness activities"
            ])
        
        priorities.extend([
            "Social support enhancement",
            "Self-care routine development",
            "Regular progress monitoring"
        ])
        
        return priorities[:5]  # Return top 5 priorities

class RecommendationEngine:
    """Engine for generating personalized recommendations"""
    
    def __init__(self):
        self.recommendation_database = self._load_recommendations()
    
    def _load_recommendations(self) -> Dict[str, List[Dict[str, str]]]:
        """Load recommendation database"""
        return {
            "depression": [
                {
                    "title": "Cognitive Behavioral Therapy (CBT)",
                    "description": "CBT helps identify and change negative thought patterns that contribute to depression.",
                    "type": "therapy"
                },
                {
                    "title": "Behavioral Activation",
                    "description": "Gradually increase pleasant and meaningful activities to improve mood.",
                    "type": "behavioral"
                },
                {
                    "title": "Exercise Routine",
                    "description": "Regular physical activity can be as effective as medication for mild to moderate depression.",
                    "type": "lifestyle"
                },
                {
                    "title": "Sleep Hygiene",
                    "description": "Establish consistent sleep patterns to support mood regulation.",
                    "type": "lifestyle"
                }
            ],
            "anxiety": [
                {
                    "title": "Deep Breathing Exercises",
                    "description": "Practice diaphragmatic breathing to activate the body's relaxation response.",
                    "type": "technique"
                },
                {
                    "title": "Progressive Muscle Relaxation",
                    "description": "Systematically tense and relax muscle groups to reduce physical anxiety.",
                    "type": "technique"
                },
                {
                    "title": "Mindfulness Meditation",
                    "description": "Practice staying present to reduce worry about future events.",
                    "type": "mindfulness"
                },
                {
                    "title": "Exposure Therapy",
                    "description": "Gradually face feared situations to reduce avoidance and build confidence.",
                    "type": "therapy"
                }
            ],
            "stress": [
                {
                    "title": "Time Management",
                    "description": "Learn to prioritize tasks and manage time more effectively.",
                    "type": "skill"
                },
                {
                    "title": "Boundary Setting",
                    "description": "Practice saying no and setting healthy limits on commitments.",
                    "type": "skill"
                },
                {
                    "title": "Stress Inoculation Training",
                    "description": "Build resilience by learning to cope with manageable levels of stress.",
                    "type": "training"
                },
                {
                    "title": "Regular Breaks",
                    "description": "Schedule regular breaks throughout the day to prevent burnout.",
                    "type": "lifestyle"
                }
            ],
            "general": [
                {
                    "title": "Social Support Network",
                    "description": "Build and maintain relationships with supportive friends and family.",
                    "type": "social"
                },
                {
                    "title": "Professional Counseling",
                    "description": "Work with a licensed mental health professional for personalized treatment.",
                    "type": "professional"
                },
                {
                    "title": "Journaling",
                    "description": "Write about thoughts and feelings to gain insight and process emotions.",
                    "type": "self-help"
                },
                {
                    "title": "Healthy Lifestyle",
                    "description": "Maintain good nutrition, regular exercise, and adequate sleep.",
                    "type": "lifestyle"
                }
            ]
        }
    
    def generate_personalized_recommendations(self, assessment_results: Dict[str, Any], 
                                            user_preferences: Optional[Dict[str, Any]] = None) -> List[Dict[str, str]]:
        """Generate personalized recommendations based on assessment and preferences"""
        recommendations = []
        
        # Get recommendations based on assessment results
        for domain, result in assessment_results.items():
            if result.get("score", 0) >= 14:  # Moderate or higher
                domain_recs = self.recommendation_database.get(domain, [])
                recommendations.extend(domain_recs[:2])  # Top 2 for each domain
        
        # Always add general recommendations
        general_recs = self.recommendation_database.get("general", [])
        recommendations.extend(general_recs[:2])
        
        # Remove duplicates and limit to 6 recommendations
        seen_titles = set()
        unique_recommendations = []
        for rec in recommendations:
            if rec["title"] not in seen_titles:
                unique_recommendations.append(rec)
                seen_titles.add(rec["title"])
                if len(unique_recommendations) >= 6:
                    break
        
        return unique_recommendations

# Global instances
session_logger = SessionLogger()
analytics = MentalHealthAnalytics()
recommendation_engine = RecommendationEngine()
