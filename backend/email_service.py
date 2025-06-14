import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import os
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending email notifications"""
    
    def __init__(self):
        """Initialize the email service with Gmail configuration"""
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.email_address = "itsharshprateek@gmail.com"
        self.email_password = "ndfl inzr sbgy scxc"  # App password
        
    async def send_email(self, recipient: str, subject: str, body: str) -> bool:
        """
        Send an email using Gmail SMTP
        
        Args:
            recipient: Recipient email address
            subject: Email subject
            body: Email body (HTML)
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["From"] = self.email_address
            message["To"] = recipient
            message["Subject"] = subject
            
            # Attach HTML body
            html_part = MIMEText(body, "html")
            message.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_address, self.email_password)
                server.send_message(message)
            
            logger.info(f"Email sent successfully to {recipient}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {recipient}: {str(e)}")
            return False
    
    async def send_severe_case_notification(self, user_data: Dict[str, Any], assessment_results: Dict[str, Any]) -> bool:
        """
        Send notification email for severe mental health cases
        
        Args:
            user_data: User information
            assessment_results: Assessment results
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Determine recipient
            recipient = self._get_recipient_email(user_data.get("reportTo", "hr"), user_data.get("department", ""))
            
            subject = f"URGENT: Mental Health Alert - {user_data['firstName']} {user_data['lastName']}"
            
            # Create message body
            body = self._create_severe_case_email_body(user_data, assessment_results)
            
            # Send email
            return await self.send_email(recipient, subject, body)
            
        except Exception as e:
            logger.error(f"Failed to send severe case notification: {str(e)}")
            return False
    
    def _get_recipient_email(self, report_to: str, department: str) -> str:
        """Get recipient email based on user preference and department"""
        hr_emails = {
            "default": "itsharshprateek@gmail.com",
            "IT": "itsharshprateek@gmail.com",
            "HR": "itsharshprateek@gmail.com",
            "Finance": "itsharshprateek@gmail.com",
            "Marketing": "itsharshprateek@gmail.com",
            "Operations": "itsharshprateek@gmail.com",
            "sales": "itsharshprateek@gmail.com"
        }
        
        manager_emails = {
            "default": "harshstring123@gmail.com",
            "IT": "harshstring123@gmail.com",
            "HR": "harshstring123@gmail.com", 
            "Finance": "harshstring123@gmail.com",
            "Marketing": "harshstring123@gmail.com",
            "Operations": "Harshstring123@gmail.com",
            "sales": "Harshstring123@gmail.com"
        }
        
        if report_to.lower() == "hr":
            return hr_emails.get(department, hr_emails["default"])
        else:
            return manager_emails.get(department, manager_emails["default"])
    
    def _create_severe_case_email_body(self, user_data: Dict[str, Any], 
                                      assessment_results: Dict[str, Any]) -> str:
        """Create HTML email body for severe case notifications"""
        return f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #ef4444; color: white; padding: 10px 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .footer {{ background-color: #f3f4f6; padding: 10px 20px; text-align: center; font-size: 12px; }}
                .alert {{ background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 10px; margin: 10px 0; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #f3f4f6; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>URGENT: Mental Health Alert</h2>
                </div>
                <div class="content">
                    <p>This is an automated alert from the MindCare AI Counseling System.</p>
                    
                    <div class="alert">
                        <p><strong>An employee has shown severe mental health indicators that require immediate attention.</strong></p>
                    </div>
                    
                    <h3>Employee Information:</h3>
                    <table>
                        <tr>
                            <th>Name</th>
                            <td>{user_data['firstName']} {user_data['lastName']}</td>
                        </tr>
                        <tr>
                            <th>Email</th>
                            <td>{user_data['email']}</td>
                        </tr>
                        <tr>
                            <th>Department</th>
                            <td>{user_data.get('department', 'Not specified')}</td>
                        </tr>
                        <tr>
                            <th>Phone</th>
                            <td>{user_data.get('phone', 'Not provided')}</td>
                        </tr>
                    </table>
                    
                    <h3>Assessment Results:</h3>
                    <table>
                        <tr>
                            <th>Depression</th>
                            <td>{assessment_results['depression']['score']} ({assessment_results['depression']['level']})</td>
                        </tr>
                        <tr>
                            <th>Anxiety</th>
                            <td>{assessment_results['anxiety']['score']} ({assessment_results['anxiety']['level']})</td>
                        </tr>
                        <tr>
                            <th>Stress</th>
                            <td>{assessment_results['stress']['score']} ({assessment_results['stress']['level']})</td>
                        </tr>
                    </table>
                    
                    <p><strong>Recommended Action:</strong> Please reach out to this employee as soon as possible to provide appropriate support and resources.</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from the MindCare AI Counseling System. Please handle this information confidentially.</p>
                </div>
            </div>
        </body>
        </html>
        """

# Create an instance of the email service
email_service = EmailService()
