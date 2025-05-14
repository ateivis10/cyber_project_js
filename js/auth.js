// Initialize local storage with sample data if it doesn't exist
function initializeLocalStorage() {
  if (!localStorage.getItem("users")) {
    localStorage.setItem("users", JSON.stringify([]))
  }
  if (!localStorage.getItem("messages")) {
    localStorage.setItem("messages", JSON.stringify([]))
  }
}

// Check if user is logged in
function checkAuth() {
  const currentUser = localStorage.getItem("currentUser")
  const currentPage = window.location.pathname.split("/").pop()

  if (!currentUser && currentPage === "home.html") {
    window.location.href = "index.html"
  } else if (currentUser && (currentPage === "index.html" || currentPage === "signup.html" || currentPage === "")) {
    window.location.href = "home.html"
  }
}

// Handle signup form submission
function handleSignup() {
  const signupForm = document.getElementById("signupForm")
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const email = document.getElementById("email").value
      const password = document.getElementById("password").value

      // Get existing users
      const users = JSON.parse(localStorage.getItem("users"))

      // Check if user already exists
      if (users.some((user) => user.email === email)) {
        alert("User already exists!")
        return
      }

      // Add new user
      users.push({ email, password })
      localStorage.setItem("users", JSON.stringify(users))

      // Redirect to login
      window.location.href = "index.html"
    })
  }
}

// Handle login form submission
function handleLogin() {
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const email = document.getElementById("email").value
      const password = document.getElementById("password").value

      // Get existing users
      const users = JSON.parse(localStorage.getItem("users"))

      // Check credentials
      const user = users.find((user) => user.email === email && user.password === password)

      if (user) {
        localStorage.setItem("currentUser", email)
        window.location.href = "home.html"
      } else {
        alert("Invalid credentials!")
      }
    })
  }
}

// Handle logout
function handleLogout() {
  const logoutBtn = document.getElementById("logoutBtn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault()
      localStorage.removeItem("currentUser")
      window.location.href = "index.html"
    })
  }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  initializeLocalStorage()
  checkAuth()
  handleSignup()
  handleLogin()
  handleLogout()
})
