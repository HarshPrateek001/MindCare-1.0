// counseling.js - Consolidated and Corrected Code

// --- API Configuration - Updated to handle different environments ---
const API_BASE_URL = (() => {
  const currentHost = window.location.origin;
  console.log("Current host:", currentHost);

  // If running on localhost:8000 (FastAPI server), use the same origin
  if (currentHost.includes("localhost:8000") || currentHost.includes("127.0.0.1:8000")) {
    return currentHost + "/api";
  }

  // Default fallback (e.g., if hosted somewhere else)
  return "http://localhost:8000/api";
})();

console.log("API Base URL:", API_BASE_URL);


// --- DASS-21 Questions ---
const dassQuestions = [
"I found it difficult to mentally disconnect from work, even after office hours.",
"I noticed physical signs of stress, such as a dry mouth, during high-pressure meetings or tasks.",
"I struggled to find any satisfaction or enjoyment in my recent work achievements.",
"I experienced shortness of breath or rapid breathing during work-related stress without physical activity.",
"I lacked motivation or energy to start work-related tasks, even those that were important.",
"I tended to react more strongly than usual to minor workplace challenges or changes.",
"I experienced physical trembling (e.g., hands shaking) during work-related stress.",
"I felt like I was using up a lot of mental and emotional energy just to keep up with work demands.",
"I worried that I might lose control or embarrass myself in professional settings like meetings or presentations.",
"I felt like there was nothing professionally or personally to look forward to in the near future.",
"I found myself feeling irritable or restless during the workday, even without a clear reason.",
"I struggled to relax or calm down during breaks or after completing my work.",
"I felt persistently low or emotionally drained, even after time off or weekends.",
"I became easily frustrated when something or someone interrupted my work progress.",
"I felt on the verge of panic during high-pressure work situations, such as deadlines or evaluations.",
"I couldn’t get excited or interested in projects, even those I normally enjoy.",
"I felt that my contributions at work didn’t matter or that I lacked value as an employee.",
"I was emotionally sensitive and easily upset by feedback or workplace interactions.",
"I could feel my heart racing or skipping beats even when I was just sitting at my desk under stress.",
"I felt sudden fear or anxiety during the workday without a clear or logical reason.",
"I often questioned the purpose of my work or felt that it had no real meaning."
];

// --- Global Variables (Declared ONCE) ---
let currentQuestion = 0;
let answers = [];
let userInfo = {}; // Stores user details from initial form
let sessionData = {
  startTime: null,
  messageCount: 0,
  assessmentResults: null, // Populated after DASS-21 assessment
};

// DOM Elements (get references ONCE)
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const chatMessagesContainer = document.getElementById("chatMessages");
const messageCountElement = document.getElementById("messageCount"); // Element to display message count

// This array will hold the conversation history in the format Groq expects
let chatHistory = []; // [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]

// --- Constants for better readability ---
const SESSION_END_REPORT_DELAY = 2000; // milliseconds before showing report after session end
const CHAT_LOADING_MESSAGE = "Connecting to AI Counselor...";

// --- Helper Functions (Implement/Adjust as needed for your UI) ---

// Placeholder: Implement your typing indicator logic
function showTypingIndicator() {
  const typingIndicator = document.createElement("div");
  typingIndicator.id = "typing-indicator";
  typingIndicator.className = "message bot-message typing-indicator";
  typingIndicator.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="message-content"><p>...</p></div>
    `;
  if (chatMessagesContainer) {
    chatMessagesContainer.appendChild(typingIndicator);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }
}

function removeTypingIndicator() {
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Placeholder: Implement your notification system
function showNotification(message, type) {
  console.log(`Notification (${type}): ${message}`);
  const notificationArea = document.getElementById("notificationArea"); // Assuming an element with this ID
  if (notificationArea) {
    notificationArea.textContent = message;
    // Apply styling based on 'type' (e.g., 'success', 'warning', 'danger', 'info')
    notificationArea.className = `notification ${type}`;
    notificationArea.style.display = 'block';
    setTimeout(() => {
        notificationArea.style.display = 'none';
    }, 5000); // Hide after 5 seconds
  }
}

// Placeholder: Function to show results report (e.g., redirect or display modal)
function showResults() {
  console.log("Showing session results/report.");
  // Example: window.location.href = "/results.html";
}

// Placeholder: Function to start the counseling session (e.g., display initial message)
function startCounselingSession(assessmentResults) {
    console.log("Counseling session started with results:", assessmentResults);
    addMessageToChat("Hello! I'm your AI mental health counselor. How can I support you today?", "bot");
}

// Placeholder: Function to start session timer (if you have one)
function startSessionTimer() {
    sessionData.startTime = new Date();
    console.log("Session timer started.");
    // Implement actual timer display logic if needed
}

// --- DASS-21 Assessment Logic ---

// Initialize counseling page (DOMContentLoaded is already handled)
document.addEventListener("DOMContentLoaded", () => {
  initializeUserInfo();
  // Attach chat event listener after DOM is ready
  if (sendButton) {
    sendButton.addEventListener("click", sendMessage);
  }
  if (messageInput) {
    messageInput.addEventListener("keypress", handleKeyPress);
  }
});

// Initialize user info collection
function initializeUserInfo() {
  const userInfoForm = document.getElementById("userInfoForm");
  if (userInfoForm) {
    userInfoForm.addEventListener("submit", handleUserInfoSubmit);
  }
}

// Handle user info form submission
function handleUserInfoSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  userInfo = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    age: Number.parseInt(formData.get("age")),
    gender: formData.get("gender"),
    department: formData.get("department"),
    reportTo: formData.get("reportTo"),
  };

  localStorage.setItem("currentUser", JSON.stringify(userInfo));

  document.getElementById("userInfoPhase").style.display = "none";
  document.getElementById("assessmentPhase").style.display = "block";

  initializeAssessment();
}

// Initialize DASS-21 assessment
function initializeAssessment() {
  loadQuestion();

  const answerOptions = document.querySelectorAll('input[name="answer"]');
  answerOptions.forEach((option) => {
    option.addEventListener("change", function () {
      document.getElementById("nextBtn").disabled = false;
      document.querySelectorAll(".answer-option").forEach((opt) => {
        opt.classList.remove("selected");
      });
      this.closest(".answer-option").classList.add("selected");
    });
  });
}

function debugAssessmentState() {
  console.log("=== Assessment Debug Info ===");
  console.log("Current question:", currentQuestion);
  console.log("Total questions:", dassQuestions.length);
  console.log("Answers so far:", answers);
  console.log("User info:", userInfo);
  console.log("API Base URL:", API_BASE_URL);
  console.log("============================");
}

function loadQuestion() {
  if (currentQuestion < dassQuestions.length) {
    document.getElementById("questionText").textContent = dassQuestions[currentQuestion];
    document.getElementById("progressText").textContent = `Question ${currentQuestion + 1} of ${dassQuestions.length}`;

    const progress = ((currentQuestion + 1) / dassQuestions.length) * 100;
    document.getElementById("progressFill").style.width = `${progress}%`;

    document.querySelectorAll('input[name="answer"]').forEach((input) => {
      input.checked = false;
    });
    document.querySelectorAll(".answer-option").forEach((opt) => {
      opt.classList.remove("selected");
    });
    document.getElementById("nextBtn").disabled = true;

    document.getElementById("prevBtn").disabled = currentQuestion === 0;

    const nextBtn = document.getElementById("nextBtn");
    if (currentQuestion === dassQuestions.length - 1) {
      nextBtn.innerHTML = '<i class="fas fa-check"></i> Complete Assessment';
    } else {
      nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
    }

    console.log(`Loaded question ${currentQuestion + 1}/${dassQuestions.length}`);
  }
}

function nextQuestion() {
  const selectedAnswer = document.querySelector('input[name="answer"]:checked');
  if (!selectedAnswer) {
    showNotification("Please select an answer before continuing.", "warning");
    return;
  }

  answers[currentQuestion] = Number.parseInt(selectedAnswer.value);
  console.log(`Question ${currentQuestion + 1} answered: ${answers[currentQuestion]}`);

  if (currentQuestion < dassQuestions.length - 1) {
    currentQuestion++;
    loadQuestion();
  } else {
    console.log("Completing assessment with all answers:", answers);
    completeAssessment();
  }
}

function previousQuestion() {
  if (currentQuestion > 0) {
    currentQuestion--;
    loadQuestion();

    if (answers[currentQuestion] !== undefined) {
      const answerValue = answers[currentQuestion];
      const answerInput = document.querySelector(`input[name="answer"][value="${answerValue}"]`);
      if (answerInput) {
        answerInput.checked = true;
        answerInput.closest(".answer-option").classList.add("selected");
        document.getElementById("nextBtn").disabled = false;
      }
    }
  }
}

async function completeAssessment() {
  const selectedAnswer = document.querySelector('input[name="answer"]:checked');
  if (!selectedAnswer) {
    showNotification("Please select an answer before completing the assessment.", "warning");
    return;
  }

  answers[currentQuestion] = Number.parseInt(selectedAnswer.value);

  const completeButton = document.getElementById("nextBtn");
  const originalText = completeButton.innerHTML;
  completeButton.innerHTML = '<i class="loading"></i> Processing Assessment...';
  completeButton.disabled = true;

  try {
    console.log("Sending assessment data:", {
      answers: answers,
      userInfo: userInfo,
    });

    const response = await fetch(`${API_BASE_URL}/assess`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        answers: answers,
        userInfo: userInfo,
      }),
    });

    console.log("Assessment response status:", response.status);

    if (response.ok) {
      const result = await response.json();
      console.log("Assessment result:", result);

      sessionData.assessmentResults = result.results;
      updateAssessmentResults(result.results);

      if (result.severeCaseDetected) {
        showNotification(
          "Your assessment indicates severe symptoms. Please consider contacting a mental health professional immediately.",
          "warning"
        );
      }

      showNotification("Assessment completed successfully!", "success");

      checkSevereCases(sessionData.assessmentResults);

      setTimeout(() => {
        document.getElementById("assessmentPhase").style.display = "none";
        document.getElementById("chatPhase").style.display = "grid";

        startCounselingSession(sessionData.assessmentResults);
        initializeChat();
        startSessionTimer();
      }, 1500);
    } else {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      console.error("Assessment API error:", errorData);
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to process assessment`);
    }
  } catch (error) {
    console.error("Assessment error:", error);

    // Show user-friendly error message
    showNotification(`Assessment failed: ${error.message}. Using offline calculation.`, "warning");

    // Fall back to client-side calculation (since backend failed for assessment)
    const results = calculateDassScores(answers);
    sessionData.assessmentResults = results;
    updateAssessmentResults(results);

    checkSevereCases(sessionData.assessmentResults);

    setTimeout(() => {
      document.getElementById("assessmentPhase").style.display = "none";
      document.getElementById("chatPhase").style.display = "grid";

      startCounselingSession(sessionData.assessmentResults);
      initializeChat();
      startSessionTimer();
    }, 1500);
  } finally {
    completeButton.innerHTML = originalText;
    completeButton.disabled = false;
  }
}

// Calculate DASS-21 scores
function calculateDassScores(answers) {
  const depressionItems = [2, 4, 9, 12, 15, 16, 20]; // 0-indexed based on DASS-21 order
  const anxietyItems = [1, 3, 6, 8, 14, 18, 19];
  const stressItems = [0, 5, 7, 10, 11, 13, 17];

  const depression = depressionItems.reduce((sum, index) => sum + (answers[index] || 0), 0) * 2;
  const anxiety = anxietyItems.reduce((sum, index) => sum + (answers[index] || 0), 0) * 2;
  const stress = stressItems.reduce((sum, index) => sum + (answers[index] || 0), 0) * 2;

  return {
    depression: {
      score: depression,
      level: getScoreLevel("depression", depression),
    },
    anxiety: {
      score: anxiety,
      level: getScoreLevel("anxiety", anxiety),
    },
    stress: {
      score: stress,
      level: getScoreLevel("stress", stress),
    },
  };
}

// Get severity level for scores
function getScoreLevel(type, score) {
  const ranges = {
    depression: {
      normal: [0, 9],
      mild: [10, 13],
      moderate: [14, 20],
      severe: [21, 27],
      extremelySevere: [28, 42],
    },
    anxiety: {
      normal: [0, 7],
      mild: [8, 9],
      moderate: [10, 14],
      severe: [15, 19],
      extremelySevere: [20, 42],
    },
    stress: {
      normal: [0, 14],
      mild: [15, 18],
      moderate: [19, 25],
      severe: [26, 33],
      extremelySevere: [34, 42],
    },
  };

  const typeRanges = ranges[type];

  if (score >= typeRanges.extremelySevere[0]) return "Extremely Severe";
  if (score >= typeRanges.severe[0]) return "Severe";
  if (score >= typeRanges.moderate[0]) return "Moderate";
  if (score >= typeRanges.mild[0]) return "Mild";
  return "Normal";
}

// Update assessment results in UI
function updateAssessmentResults(results) {
  document.getElementById("depressionScore").textContent = `${results.depression.score} (${results.depression.level})`;
  document.getElementById("anxietyScore").textContent = `${results.anxiety.score} (${results.anxiety.level})`;
  document.getElementById("stressScore").textContent = `${results.stress.score} (${results.stress.level})`;

  updateScoreColor("depressionScore", results.depression.level);
  updateScoreColor("anxietyScore", results.anxiety.level);
  updateScoreColor("stressScore", results.stress.level);
}

// Update score color based on severity
function updateScoreColor(elementId, level) {
  const element = document.getElementById(elementId);
  if (element) {
    element.className = "result-value";
    switch (level) {
      case "Normal":
        element.style.backgroundColor = "#22c55e"; // Green
        break;
      case "Mild":
        element.style.backgroundColor = "#f59e0b"; // Amber
        break;
      case "Moderate":
        element.style.backgroundColor = "#f97316"; // Orange
        break;
      case "Severe":
        element.style.backgroundColor = "#ef4444"; // Red
        break;
      case "Extremely Severe":
        element.style.backgroundColor = "#dc2626"; // Darker red
        break;
      default:
        element.style.backgroundColor = "#6b7280"; // Gray fallback
        break;
    }
    element.style.color = "white";
  }
}

// Check for severe cases and show alert
function checkSevereCases(results) {
  const hasSevereCase = Object.values(results).some(
    (result) => result.level === "Severe" || result.level === "Extremely Severe",
  );

  if (hasSevereCase) {
    showNotification(
      "Your assessment indicates severe symptoms. Please consider contacting a mental health professional immediately. Emergency resources are available in the sidebar.",
      "warning",
    );

    console.log("SEVERE CASE DETECTED:", {
      user: userInfo,
      results: results,
      timestamp: new Date().toISOString(),
    });
  }
}

// Initialize chat functionality
function initializeChat() {
  sessionData.startTime = new Date()
  // sessionData.startTime is set in startSessionTimer
  // Event listeners are set up in DOMContentLoaded
  console.log("Chat initialized.");
  // Add an initial welcome message
  // addMessageToChat("Hello! I'm your AI mental health counselor. How can I support you today?", "bot");
}

// Handle key press in message input
function handleKeyPress(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // Prevent new line
    sendMessage();
  }
}

// Function to add messages to the chat display AND to the history array
function addMessageToChat(message, sender) {
  const messageElement = document.createElement("div");
  messageElement.className = `message ${sender}-message`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.innerHTML =
    sender === "user"
      ? '<i class="fas fa-user"></i>'
      : '<i class="fas fa-robot"></i>';

  const content = document.createElement("div");
  content.className = "message-content";
  content.innerHTML = `
        <p>${message}</p>
        <span class="message-time">${new Date().toLocaleTimeString()}</span>
    `;

  messageElement.appendChild(avatar);
  messageElement.appendChild(content);

  if (chatMessagesContainer) { // Check if container exists before appending
    chatMessagesContainer.appendChild(messageElement);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  // --- IMPORTANT: Update chatHistory in the correct format ---
  if (sender === "user") {
    chatHistory.push({ role: "user", content: 'Hello, How are you?' });
  } else if (sender === "bot") { // 'bot' corresponds to 'assistant' role for Groq
    chatHistory.push({ role: "assistant", content: 'I am doing well, thank you for asking. ' });
  }
}

// --- Main function to send messages to the Groq API ---
async function sendMessage() {
  const message = messageInput.value.trim();

  if (!message) return;

  // Add user message to chat display and history
  addMessageToChat(message, "user");
  messageInput.value = ""; // Clear input after sending

  // Update message count (if you still want to track it)
  sessionData.messageCount++;
  if (messageCountElement) {
    messageCountElement.textContent = sessionData.messageCount;
  }

  // Disable input and button while waiting for response
  if (messageInput) messageInput.disabled = true;
  if (sendButton) sendButton.disabled = true;

  // Show typing indicator
  showTypingIndicator();

  try {
    console.log("Sending message to AI:", message);
    console.log("Current session history being sent:", chatHistory); // For debugging

    // Send to backend API
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        assessmentResults: sessionData.assessmentResults, // Ensure this is correctly populated
        sessionHistory: chatHistory, // <-- Send the accumulated chat history
      }),
    });

    console.log("Chat API response status:", response.status);

    if (response.ok) {
      const result = await response.json();
      console.log("AI response received:", result);

      removeTypingIndicator();
      addMessageToChat(result.response, "bot"); // Add AI response to chat display and history

      // Re-enable input and button
      if (messageInput) messageInput.disabled = false;
      if (sendButton) sendButton.disabled = false;

      // Check if session should end (determined by backend)
      if (result.shouldEndSession) {
        showNotification(
          "The AI counselor has ended the session. Preparing your report...",
          "info"
        );
        // Optional: If you want to clear history for a new session, do it here:
        // chatHistory = [];
        setTimeout(() => {
          showResults();
        }, SESSION_END_REPORT_DELAY);
      }
    } else {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      console.error("Chat API error:", errorData);
      // Throwing error here to jump to catch block for centralized error handling
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
  } catch (error) {
    console.error("Chat error:", error);
    removeTypingIndicator();

    // Re-enable input and button
    if (messageInput) messageInput.disabled = false;
    if (sendButton) sendButton.disabled = false;

    // Show error message to user (NO fallback AI, as requested)
    showNotification(
      `Failed to get response from AI: ${error.message}. Please try again later.`,
      "danger" // Use 'danger' or 'error' for critical issues
    );
  }
}

// --- Optional: Quick Response / Initial Load ---
// Function to send quick response (e.g., from quick reply buttons)
function sendQuickResponse(message) {
  if (messageInput) {
    messageInput.value = message;
  }
  sendMessage();
}

// Initial welcome message (optional, you might have this in main.py)
// addMessageToChat("Hello! I'm your AI mental health counselor. How are you feeling today?", "bot");
// Show typing indicator
function showTypingIndicator() {
  const chatMessages = document.getElementById("chatMessages")
  const typingElement = document.createElement("div")
  typingElement.className = "message bot-message typing-indicator"
  typingElement.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
            </div>
        </div>
    `

  // Add typing animation styles
  const style = document.createElement("style")
  style.textContent = `
        .typing-dots {
            display: flex;
            gap: 4px;
            padding: 1rem;
        }
        .typing-dots span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #6b7280;
            animation: typing 1.4s infinite ease-in-out;
        }
        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typing {
            0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
        }
    `
  document.head.appendChild(style)

  chatMessages.appendChild(typingElement)
  chatMessages.scrollTop = chatMessages.scrollHeight
}

// Remove typing indicator
function removeTypingIndicator() {
  const typingIndicator = document.querySelector(".typing-indicator")
  if (typingIndicator) {
    typingIndicator.remove()
  }
}

// Get chat history
function getChatHistory() {
  const messages = document.querySelectorAll(".message:not(.typing-indicator)")
  return Array.from(messages).map((message) => {
    const isUser = message.classList.contains("user-message")
    const content = message.querySelector(".message-content p").textContent
    return {
      sender: isUser ? "user" : "bot",
      message: content,
      timestamp: new Date().toISOString(),
    }
  })
}

// Start counseling session with initial AI message
function startCounselingSession(results) {
  const severity = Math.max(results.depression.score, results.anxiety.score, results.stress.score)
  const user = JSON.parse(localStorage.getItem("currentUser"))

  let initialMessage = `Hello ${user.firstName}! I'm your AI counselor. Based on your assessment, I'm here to provide personalized support and guidance. `

  if (severity >= 21) {
    initialMessage +=
      "I notice you're experiencing significant challenges right now. Please know that you're not alone, and seeking help is a brave step. "
  } else if (severity >= 14) {
    initialMessage +=
      "I can see you're dealing with some difficulties. It's great that you're taking steps to address your mental health. "
  } else {
    initialMessage +=
      "Your assessment shows you're managing well overall. Let's work together to maintain and improve your mental wellness. "
  }

  initialMessage += "How are you feeling right now, and what would you like to talk about?"

  setTimeout(() => {
    // Clear the initial message and add the personalized one
    document.getElementById("chatMessages").innerHTML = ""
    addMessageToChat(initialMessage, "bot")
  }, 1000)
}

// Function to start/update the session timer display
function startSessionTimer() {
    // Clear any existing interval to prevent multiple timers running
    if (sessionData.timerIntervalId) {
        clearInterval(sessionData.timerIntervalId);
    }

    sessionData.timerIntervalId = setInterval(() => {
        const sessionDurationElement = document.getElementById("sessionDuration");

        // Basic check: Ensure the element exists and startTime is set
        if (!sessionDurationElement) {
            console.error("Error: HTML element with ID 'sessionDuration' not found. Please ensure it exists in your HTML.");
            clearInterval(sessionData.timerIntervalId); // Stop the interval if element is not found
            return;
        }

        if (sessionData.startTime instanceof Date) { // Ensure startTime is a valid Date object
            const elapsed = new Date().getTime() - sessionData.startTime.getTime(); // Get time in milliseconds
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);

            // Format minutes and seconds to always have two digits
            const formattedMinutes = minutes.toString().padStart(2, "0");
            const formattedSeconds = seconds.toString().padStart(2, "0");

            sessionDurationElement.textContent = `${formattedMinutes}:${formattedSeconds}`;
        } else {
            // If startTime is not a Date object, log a warning and stop the timer
            console.warn("sessionData.startTime is not a valid Date object. Timer not updating.");
            sessionDurationElement.textContent = "00:00"; // Reset display
            clearInterval(sessionData.timerIntervalId); // Stop the interval
        }
    }, 1000); // Update every 1 second
}

// Show results phase
function showResults() {
  document.getElementById("chatPhase").style.display = "none"
  document.getElementById("resultsPhase").style.display = "block"

  const results = sessionData.assessmentResults

  // Update final scores
  document.getElementById("finalDepressionScore").textContent = results.depression.score
  document.getElementById("depressionLevel").textContent = results.depression.level
  document.getElementById("finalAnxietyScore").textContent = results.anxiety.score
  document.getElementById("anxietyLevel").textContent = results.anxiety.level
  document.getElementById("finalStressScore").textContent = results.stress.score
  document.getElementById("stressLevel").textContent = results.stress.level

  // Update score level colors
  updateScoreLevelColor("depressionLevel", results.depression.level)
  updateScoreLevelColor("anxietyLevel", results.anxiety.level)
  updateScoreLevelColor("stressLevel", results.stress.level)

  // Display recommendations
  displayRecommendations(generateRecommendations(results))
}

// Update score level color
function updateScoreLevelColor(elementId, level) {
  const element = document.getElementById(elementId)
  element.className = "score-level"

  switch (level) {
    case "Normal":
      element.style.backgroundColor = "#22c55e"
      break
    case "Mild":
      element.style.backgroundColor = "#f59e0b"
      break
    case "Moderate":
      element.style.backgroundColor = "#f97316"
      break
    case "Severe":
      element.style.backgroundColor = "#ef4444"
      break
    case "Extremely Severe":
      element.style.backgroundColor = "#dc2626"
      break
  }
  element.style.color = "white"
}

// Display recommendations
function displayRecommendations(recommendations) {
  const recommendationsList = document.getElementById("recommendationsList")
  recommendationsList.innerHTML = ""

  recommendations.forEach((recommendation) => {
    const recommendationElement = document.createElement("div")
    recommendationElement.className = "recommendation-item"
    recommendationElement.innerHTML = `
            <h4>${recommendation.title}</h4>
            <p>${recommendation.description}</p>
        `
    recommendationsList.appendChild(recommendationElement)
  })
}

// Generate recommendations based on assessment results
function generateRecommendations(results) {
  const recommendations = []

  // Depression recommendations
  if (results.depression.score >= 14) {
    recommendations.push({
      title: "Professional Counseling",
      description:
        "Consider speaking with a licensed mental health professional who can provide personalized treatment strategies for depression.",
    })
    recommendations.push({
      title: "Daily Routine",
      description:
        "Establish a consistent daily routine with regular sleep, meals, and activities to help stabilize mood.",
    })
  }

  // Anxiety recommendations
  if (results.anxiety.score >= 10) {
    recommendations.push({
      title: "Breathing Exercises",
      description: "Practice deep breathing techniques and mindfulness meditation to help manage anxiety symptoms.",
    })
    recommendations.push({
      title: "Gradual Exposure",
      description:
        "Gradually face anxiety-provoking situations in a controlled way to build confidence and reduce avoidance.",
    })
  }

  // Stress recommendations
  if (results.stress.score >= 19) {
    recommendations.push({
      title: "Stress Management",
      description:
        "Learn stress management techniques such as time management, relaxation exercises, and setting boundaries.",
    })
    recommendations.push({
      title: "Physical Activity",
      description:
        "Engage in regular physical exercise, which can significantly reduce stress levels and improve overall well-being.",
    })
  }

  // General recommendations
  recommendations.push({
    title: "Social Support",
    description:
      "Connect with friends, family, or support groups. Social connections are crucial for mental health recovery.",
  })

  recommendations.push({
    title: "Self-Care Practices",
    description:
      "Prioritize self-care activities that you enjoy and that help you relax, such as hobbies, reading, or listening to music.",
  })

  return recommendations
}

// Export chat functionality
function exportChat() {
  const chatHistory = getChatHistory()
  const results = sessionData.assessmentResults
  const user = JSON.parse(localStorage.getItem("currentUser"))

  const exportData = {
    sessionDate: new Date().toISOString(),
    duration: document.getElementById("sessionDuration").textContent,
    user: user,
    assessmentResults: results,
    chatHistory: chatHistory,
    recommendations: generateRecommendations(results),
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `mindcare-session-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// End session
async function endSession() {
  if (confirm("Are you sure you want to end this session?")) {
    try {
      const sessionDataToSend = {
        assessmentResults: sessionData.assessmentResults,
        chatHistory: getChatHistory(),
        userInfo: JSON.parse(localStorage.getItem("currentUser")),
        recommendations: generateRecommendations(sessionData.assessmentResults),
      }

      const response = await fetch(`${API_BASE_URL}/end-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionDataToSend),
      })

      if (response.ok) {
        showNotification("Session ended successfully. Report has been sent.", "success")
        showResults()
      } else {
        throw new Error("Failed to end session")
      }
    } catch (error) {
      console.error("Error ending session:", error)
      showNotification("Session ended locally. Report could not be sent.", "warning")
      showResults()
    }
  }
}

// Emergency contact
function emergencyContact() {
  const modal = document.createElement("div")
  modal.className = "emergency-modal"
  modal.innerHTML = `
        <div class="modal-content">
            <h3>Emergency Resources</h3>
            <div class="emergency-info">
                <p><strong>If you're in immediate danger, call 911</strong></p>
                <p><strong>National Suicide Prevention Lifeline:</strong> 988 or 1-800-273-8255</p>
                <p><strong>Crisis Text Line:</strong> Text HOME to 741741</p>
                <p><strong>National Domestic Violence Hotline:</strong> 1-800-799-7233</p>
            </div>
            <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `

  // Add modal styles
  modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `

  modal.querySelector(".modal-content").style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 0.5rem;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    `

  document.body.appendChild(modal)
}

// Download report as Word document
async function downloadReport() {
  try {
    const sessionDataToSend = {
      assessmentResults: sessionData.assessmentResults,
      chatHistory: getChatHistory(),
      userInfo: JSON.parse(localStorage.getItem("currentUser")),
      recommendations: generateRecommendations(sessionData.assessmentResults),
    }

    console.log("Requesting Word report download...")

    const response = await fetch(`${API_BASE_URL}/download-report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionDataToSend),
    })

    if (response.ok) {
      // Get the blob from response
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url

      // Get filename from response headers or create default
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = "MindCare_Report.docx"

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      showNotification("Report downloaded successfully!", "success")
    } else {
      throw new Error("Failed to generate report")
    }
  } catch (error) {
    console.error("Error downloading report:", error)
    showNotification("Failed to download Word report. Downloading JSON instead.", "warning")

    // Fallback to JSON download
    downloadJSONReport()
  }
}

// Fallback JSON download function
function downloadJSONReport() {
  const results = sessionData.assessmentResults
  const recommendations = generateRecommendations(results)
  const user = JSON.parse(localStorage.getItem("currentUser"))

  const reportData = {
    date: new Date().toLocaleDateString(),
    user: user,
    assessmentResults: results,
    recommendations: recommendations,
    chatHistory: getChatHistory(),
  }

  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `mindcare-report-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Start new session
function startNewSession() {
  // Reset all data
  currentQuestion = 0
  answers = []
  userInfo = {}
  sessionData = {
    startTime: new Date(),
    messageCount: 0,
    assessmentResults: null,
  }

  // Clear localStorage
  localStorage.removeItem("currentUser")

  // Reset UI
  document.getElementById("chatMessages").innerHTML = ""
  document.getElementById("messageCount").textContent = "0"
  document.getElementById("sessionDuration").textContent = "00:00"
  document.getElementById("depressionScore").textContent = "-"
  document.getElementById("anxietyScore").textContent = "-"
  document.getElementById("stressScore").textContent = "-"

  // Show user info phase
  document.getElementById("resultsPhase").style.display = "none"
  document.getElementById("chatPhase").style.display = "none"
  document.getElementById("assessmentPhase").style.display = "none"
  document.getElementById("userInfoPhase").style.display = "block"

  // Reset form
  document.getElementById("userInfoForm").reset()
}

// Notification system
function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="notification-close">×</button>
        </div>
    `

  // Add notification styles
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `

  notification.querySelector(".notification-content").style.cssText = `
        display: flex;
        align-items: center;
        gap: 0.75rem;
    `

  notification.querySelector(".notification-close").style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
    `

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.transform = "translateX(0)"
  }, 100)

  setTimeout(() => {
    notification.style.transform = "translateX(100%)"
    setTimeout(() => notification.remove(), 300)
  }, 5000)
}

function getNotificationIcon(type) {
  switch (type) {
    case "success":
      return "fa-check-circle"
    case "error":
      return "fa-exclamation-circle"
    case "warning":
      return "fa-exclamation-triangle"
    default:
      return "fa-info-circle"
  }
}

function getNotificationColor(type) {
  switch (type) {
    case "success":
      return "#22c55e"
    case "error":
      return "#ef4444"
    case "warning":
      return "#f97316"
    default:
      return "#3b82f6"
  }
}
