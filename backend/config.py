import os
from typing import Dict, Any

class Config:
    """Configuration settings for the MindCare backend"""
    
    # API Settings
    API_TITLE = "MindCare AI Counselor API"
    API_DESCRIPTION = "Backend API for MindCare Mental Health AI Counselor"
    API_VERSION = "1.0.0"
    
    # Server Settings
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    
    # CORS Settings
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    
    # Logging Settings
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # AI Model Settings
    MAX_SESSION_LENGTH = int(os.getenv("MAX_SESSION_LENGTH", 15))  # Maximum number of exchanges
    RESPONSE_DELAY_MIN = float(os.getenv("RESPONSE_DELAY_MIN", 1.0))  # Minimum response delay in seconds
    RESPONSE_DELAY_MAX = float(os.getenv("RESPONSE_DELAY_MAX", 3.0))  # Maximum response delay in seconds
    
    # Assessment Settings
    DASS21_SEVERE_THRESHOLD = {
        "depression": 21,
        "anxiety": 15,
        "stress": 26
    }
    
    # Crisis Detection Settings
    CRISIS_KEYWORDS = [
        "suicide", "kill myself", "end my life", "die", "death",
        "no point", "better off dead", "hurt myself", "harm myself"
    ]
    
    # Email Settings (for future use)
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    
    # Emergency Contacts
    EMERGENCY_CONTACTS = {
        "suicide_prevention": "988",
        "crisis_text": "741741",
        "emergency": "911"
    }
    
    @classmethod
    def get_cors_settings(cls) -> Dict[str, Any]:
        """Get CORS middleware settings"""
        return {
            "allow_origins": cls.ALLOWED_ORIGINS,
            "allow_credentials": True,
            "allow_methods": ["*"],
            "allow_headers": ["*"]
        }
    
    @classmethod
    def get_logging_config(cls) -> Dict[str, Any]:
        """Get logging configuration"""
        return {
            "level": cls.LOG_LEVEL,
            "format": cls.LOG_FORMAT
        }

# Development configuration
class DevelopmentConfig(Config):
    DEBUG = True
    LOG_LEVEL = "DEBUG"

# Production configuration
class ProductionConfig(Config):
    DEBUG = False
    LOG_LEVEL = "WARNING"
    ALLOWED_ORIGINS = ["https://yourdomain.com"]  # Replace with actual domain

# Configuration factory
def get_config() -> Config:
    """Get configuration based on environment"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return ProductionConfig()
    else:
        return DevelopmentConfig()

# Global config instance
config = get_config()
