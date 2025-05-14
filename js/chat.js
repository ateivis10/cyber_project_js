// Load users list
function loadUsers() {
  const currentUser = localStorage.getItem("currentUser")
  if (!currentUser) return

  const users = JSON.parse(localStorage.getItem("users"))
  const usersList = document.getElementById("usersList")

  if (usersList) {
    usersList.innerHTML = ""

    users.forEach((user) => {
      if (user.email !== currentUser) {
        const userLink = document.createElement("a")
        userLink.href = `#${user.email}`
        userLink.textContent = user.email
        userLink.addEventListener("click", (e) => {
          e.preventDefault()
          loadChat(user.email)
        })

        usersList.appendChild(userLink)
      }
    })
  }
}

// Load chat with selected user
function loadChat(selectedUser) {
  const currentUser = localStorage.getItem("currentUser")
  if (!currentUser) return

  const chatArea = document.getElementById("chatArea")
  if (!chatArea) return

  // Create chat interface
  chatArea.innerHTML = `
    <div class="messages">
      <h3>Chat with ${selectedUser}</h3>
      <div id="messagesList"></div>
    </div>
    
    <form class="send-message-form" id="messageForm">
      <textarea id="message" required placeholder="Type your message..."></textarea>
      <button type="submit">Send</button>
      <label style="margin-left:10px;">
        <input type="checkbox" id="secretToggle" onchange="toggleSecret()"> Secret
      </label>
    </form>
    
    <div id="secretOptions" style="display:none; margin-top: 10px;">
      <form class="send-message-form" id="secretForm">
        <textarea id="secret_message" placeholder="Type your secret message..." required></textarea>
        <select id="cipher" required>
          <option value="">Select Cipher</option>
          <option value="autokey">Autokey Cipher</option>
          <option value="playfair">Playfair Cipher</option>
        </select>
        <input type="text" id="key" placeholder="Enter key/keyword" required>
        <button type="submit">Send Secret</button>
      </form>
    </div>
  `

  // Load messages
  loadMessages(selectedUser)

  // Add event listeners for forms
  const messageForm = document.getElementById("messageForm")
  const secretForm = document.getElementById("secretForm")

  messageForm.addEventListener("submit", (e) => {
    e.preventDefault()
    const message = document.getElementById("message").value
    sendMessage(selectedUser, message, false)
    document.getElementById("message").value = ""
  })

  secretForm.addEventListener("submit", (e) => {
    e.preventDefault()
    const secretMessage = document.getElementById("secret_message").value
    const cipher = document.getElementById("cipher").value
    const key = document.getElementById("key").value

    sendSecretMessage(selectedUser, secretMessage, cipher, key)

    document.getElementById("secret_message").value = ""
    document.getElementById("key").value = ""
    document.getElementById("cipher").value = ""
  })

  // Make toggleSecret function available globally
  window.toggleSecret = () => {
    const isChecked = document.getElementById("secretToggle").checked
    document.getElementById("secretOptions").style.display = isChecked ? "block" : "none"
    document.getElementById("message").disabled = isChecked
  }
}

// Load messages between current user and selected user
function loadMessages(selectedUser) {
  const currentUser = localStorage.getItem("currentUser")
  if (!currentUser) return

  const messages = JSON.parse(localStorage.getItem("messages"))
  const messagesList = document.getElementById("messagesList")

  if (messagesList) {
    messagesList.innerHTML = ""

    const filteredMessages = messages.filter(
      (msg) =>
        (msg.sender_email === currentUser && msg.receiver_email === selectedUser) ||
        (msg.sender_email === selectedUser && msg.receiver_email === currentUser),
    )

    filteredMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

    filteredMessages.forEach((msg) => {
      const isSecret = msg.message.startsWith("[SECRET]")
      const displayMsg = isSecret ? msg.message.substring(8) : msg.message
      const isSelf = msg.sender_email === currentUser

      const messageDiv = document.createElement("div")
      messageDiv.className = `message ${isSelf ? "self" : ""}`

      let messageContent = `
        <strong>${msg.sender_email}:</strong><br>
        ${displayMsg}
      `

      if (isSecret) {
        messageContent += `
          <br>
          <button onclick="decryptMessage(this, '${displayMsg}')">Decrypt</button>
          <div class="decrypted"></div>
        `
      }

      messageContent += `<br><small>${msg.timestamp}</small>`

      messageDiv.innerHTML = messageContent
      messagesList.appendChild(messageDiv)
    })

    // Scroll to bottom
    messagesList.scrollTop = messagesList.scrollHeight
  }
}

// Send regular message
function sendMessage(receiver, message, isSecret = false) {
  const currentUser = localStorage.getItem("currentUser")
  if (!currentUser) return

  const messages = JSON.parse(localStorage.getItem("messages"))

  const newMessage = {
    sender_email: currentUser,
    receiver_email: receiver,
    message: message,
    timestamp: new Date().toISOString(),
    is_encrypted: isSecret,
  }

  messages.push(newMessage)
  localStorage.setItem("messages", JSON.stringify(messages))

  // Reload messages
  loadMessages(receiver)
}

// Send secret message
function sendSecretMessage(receiver, message, cipher, key) {
  const currentUser = localStorage.getItem("currentUser")
  if (!currentUser) return

  let encryptedMessage

  if (cipher === "autokey") {
    encryptedMessage = autokeyEncrypt(message, key)
  } else if (cipher === "playfair") {
    encryptedMessage = playfairEncrypt(message, key)
  } else {
    alert("Invalid cipher selected.")
    return
  }

  sendMessage(receiver, "[SECRET]" + encryptedMessage, true)
}

// Autokey Encryption
function autokeyEncrypt(plaintext, key) {
  plaintext = plaintext.toUpperCase().replace(/[^A-Z]/g, "")
  key = key.toUpperCase().replace(/[^A-Z]/g, "")
  const fullKey = key + plaintext
  let ciphertext = ""

  for (let i = 0; i < plaintext.length; i++) {
    const p = plaintext.charCodeAt(i) - 65
    const k = fullKey.charCodeAt(i) - 65
    const c = (p + k) % 26
    ciphertext += String.fromCharCode(c + 65)
  }

  return ciphertext
}

// Playfair Encryption
function playfairEncrypt(plaintext, key) {
  function generateMatrix(key) {
    key = key
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .replace(/J/g, "I")
    const matrix = []
    const used = {}
    const combined = key + "ABCDEFGHIKLMNOPQRSTUVWXYZ"

    for (const char of combined) {
      if (!used[char]) {
        used[char] = true
        matrix.push(char)
      }
    }

    return Array(5)
      .fill()
      .map((_, i) => matrix.slice(i * 5, i * 5 + 5))
  }

  function getPos(matrix, char) {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (matrix[r][c] === char) return [r, c]
      }
    }
    return null
  }

  plaintext = plaintext
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .replace(/J/g, "I")

  // Handle double letters and odd length
  let prepared = ""
  for (let i = 0; i < plaintext.length; i++) {
    prepared += plaintext[i]
    if (i + 1 < plaintext.length) {
      if (plaintext[i] === plaintext[i + 1]) {
        prepared += "X"
      }
    }
  }

  if (prepared.length % 2 !== 0) {
    prepared += "X"
  }

  const matrix = generateMatrix(key)
  let result = ""

  for (let i = 0; i < prepared.length; i += 2) {
    const a = prepared[i],
      b = prepared[i + 1]
    const [ra, ca] = getPos(matrix, a)
    const [rb, cb] = getPos(matrix, b)

    if (ra === rb) {
      result += matrix[ra][(ca + 1) % 5]
      result += matrix[rb][(cb + 1) % 5]
    } else if (ca === cb) {
      result += matrix[(ra + 1) % 5][ca]
      result += matrix[(rb + 1) % 5][cb]
    } else {
      result += matrix[ra][cb]
      result += matrix[rb][ca]
    }
  }

  return result
}

// Autokey Decryption
function autokeyDecrypt(ciphertext, key) {
  ciphertext = ciphertext.toUpperCase().replace(/[^A-Z]/g, "")
  key = key.toUpperCase().replace(/[^A-Z]/g, "")
  let plaintext = ""

  for (let i = 0; i < ciphertext.length; i++) {
    const keyChar = i < key.length ? key[i] : plaintext[i - key.length]
    const p = (ciphertext.charCodeAt(i) - keyChar.charCodeAt(0) + 26) % 26
    plaintext += String.fromCharCode(p + 65)
  }

  return plaintext
}

// Playfair Decryption
function playfairDecrypt(ciphertext, key) {
  function generateMatrix(key) {
    key = key
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .replace(/J/g, "I")
    const matrix = []
    const used = {}
    const combined = key + "ABCDEFGHIKLMNOPQRSTUVWXYZ"

    for (const char of combined) {
      if (!used[char]) {
        used[char] = true
        matrix.push(char)
      }
    }

    return Array(5)
      .fill()
      .map((_, i) => matrix.slice(i * 5, i * 5 + 5))
  }

  function getPos(matrix, char) {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (matrix[r][c] === char) return [r, c]
      }
    }
    return null
  }

  ciphertext = ciphertext
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .replace(/J/g, "I")
  const matrix = generateMatrix(key)
  let result = ""

  for (let i = 0; i < ciphertext.length; i += 2) {
    const a = ciphertext[i],
      b = ciphertext[i + 1]
    const [ra, ca] = getPos(matrix, a)
    const [rb, cb] = getPos(matrix, b)

    if (ra === rb) {
      result += matrix[ra][(ca + 4) % 5]
      result += matrix[rb][(cb + 4) % 5]
    } else if (ca === cb) {
      result += matrix[(ra + 4) % 5][ca]
      result += matrix[(rb + 4) % 5][cb]
    } else {
      result += matrix[ra][cb]
      result += matrix[rb][ca]
    }
  }

  // Remove padding X between duplicate letters
  result = result.replace(/([A-Z])X(?=\1)/g, "$1")

  // Remove trailing X if original length was odd
  if (result.endsWith("X")) result = result.slice(0, -1)

  return result
}

// Global function for decryption
window.decryptMessage = (button, ciphertext) => {
  const cipher = prompt("Enter cipher type (autokey/playfair):")
  const key = prompt("Enter key:")
  let decrypted = ""

  if (!cipher || !key) return

  if (cipher.toLowerCase() === "autokey") {
    decrypted = autokeyDecrypt(ciphertext, key)
  } else if (cipher.toLowerCase() === "playfair") {
    decrypted = playfairDecrypt(ciphertext, key)
  } else {
    alert("Unsupported cipher.")
    return
  }

  const div = button.nextElementSibling
  div.innerText = "Decrypted: " + decrypted
}

// Initialize chat functionality
document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser")
  if (currentUser && window.location.pathname.includes("home.html")) {
    loadUsers()

    // Check if there's a hash in the URL to load a specific chat
    const hash = window.location.hash.substring(1)
    if (hash) {
      loadChat(hash)
    }
  }
})
