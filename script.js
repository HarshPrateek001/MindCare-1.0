// Global variables
let currentUser = null

// DOM Content Loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  animateStats()
  initializeNavigation()
})

// Initialize Application
function initializeApp() {
  // Check if user has completed a session
  const user = localStorage.getItem("currentUser")
  if (user) {
    currentUser = JSON.parse(user)
    updateNavigation()
  }

  // Initialize animations
  initializeAnimations()
}

// Navigation functionality
function initializeNavigation() {
  const hamburger = document.querySelector(".hamburger")
  const navMenu = document.querySelector(".nav-menu")

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active")
      hamburger.classList.toggle("active")
    })
  }
}

// Update navigation based on user status
function updateNavigation() {
  const loginBtn = document.querySelector(".login-btn")
  if (loginBtn && currentUser) {
    loginBtn.textContent = `Welcome, ${currentUser.firstName}`
    loginBtn.href = "counseling.html"
  }
}

// Animate statistics counters
function animateStats() {
  const statNumbers = document.querySelectorAll(".stat-number")

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = Number.parseInt(entry.target.dataset.target)
        animateCounter(entry.target, target)
        observer.unobserve(entry.target)
      }
    })
  })

  statNumbers.forEach((stat) => {
    observer.observe(stat)
  })
}

// Counter animation function
function animateCounter(element, target) {
  let current = 0
  const increment = target / 100
  const timer = setInterval(() => {
    current += increment
    if (current >= target) {
      current = target
      clearInterval(timer)
    }
    element.textContent = Math.floor(current).toLocaleString()
  }, 20)
}

// Initialize scroll animations
function initializeAnimations() {
  const animatedElements = document.querySelectorAll(".feature-card, .team-member, .value-item")

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-in")
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.1,
    },
  )

  animatedElements.forEach((element) => {
    observer.observe(element)
  })
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  })
})

// Contact form handling
document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.getElementById("contactForm")
  if (contactForm) {
    contactForm.addEventListener("submit", handleContactForm)
  }
})

async function handleContactForm(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const contactData = {
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  }

  try {
    const response = await fetch("/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactData),
    })

    if (response.ok) {
      showNotification("Thank you for your message! We'll get back to you soon.", "success")
      e.target.reset()
    } else {
      throw new Error("Failed to send message")
    }
  } catch (error) {
    showNotification("Sorry, there was an error sending your message. Please try again.", "error")
  }
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
