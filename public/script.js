const chatBox = document.getElementById("chat");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic");

// Sales scenario greeting
const greetings = [
  "Your customer says: \"It costs too much.\" How do you respond?",
  "Your customer says: \"I'm not interested.\" What do you say?",
  "Your customer says: \"I'm too busy.\" What's your move?",
  "Your customer says: \"Just email me something.\" What's your reply?",
  "Your customer says: \"Now's not a good time.\" What do you say?"
];

const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
addMessage("bot", randomGreeting);

// Handle Send button click
sendBtn.addEventListener("click", () => {
  const text = input.value.trim();
  if (text !== "") {
    handleUserMessage(text);
  }
});

// Handle Enter key
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendBtn.click();
  }
});

// Handle voice input
micBtn.addEventListener("click", () => {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech recognition not supported in this browser.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const voiceText = event.results[0][0].transcript;
    input.value = voiceText;
    sendBtn.click();
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

  recognition.start();
});

// Core message handler
function handleUserMessage(text) {
  addMessage("user", text);
  input.value = "";
  input.disabled = true;
  sendBtn.disabled = true;

  const loadingId = addMessage("bot", "typing...", true); // show typing

  sendToGPT(text)
    .then((reply) => {
      updateMessage(loadingId, reply);
    })
    .catch((err) => {
      console.error(err);
      updateMessage(loadingId, "Oops! Something went wrong.");
    })
    .finally(() => {
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    });
}

// Adds message to chat box
function addMessage(role, text, isLoading = false) {
  const message = document.createElement("div");
  message.classList.add("message", role);

  const content = document.createElement("span");
  content.textContent = text;

  const timestamp = document.createElement("small");
  timestamp.classList.add("timestamp");
  timestamp.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  message.appendChild(content);
  message.appendChild(timestamp);
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (isLoading) {
    message.classList.add("loading");
    return message; // return element so it can be updated later
  }

  return null;
}

// Replace the text of a message
function updateMessage(messageElement, newText) {
  if (!messageElement) return;
  messageElement.classList.remove("loading");
  messageElement.querySelector("span").textContent = newText;
}

// Send input to GPT backend
async function sendToGPT(userMessage) {
  const response = await fetch("http://michaelsaurus.com/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: userMessage })
  });

  if (!response.ok) {
    throw new Error("Server error: " + response.statusText);
  }

  const data = await response.json();
  return data.reply || "No response from bot.";
}
