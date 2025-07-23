const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

const app = express();
const PORT = 3000;

// ✅ Ensure API key is present
if (!process.env.OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY not found in environment variables.');
  process.exit(1);
}

// ✅ CORS configuration to allow frontend from michaelsaurus.com
app.use(cors({
  origin: 'http://michaelsaurus.com', // or use a wildcard '*' for testing
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Middleware for JSON parsing
app.use(express.json());

// ✅ Serve static files from a 'public' subdirectory (optional if hosting chat.html elsewhere)
app.use('/chat', express.static(path.join(__dirname, 'public')));

// ✅ Handle OPTIONS preflight
app.options('*', cors());

// ✅ Optional root route
app.get('/', (req, res) => {
  res.send('✅ Backend is running');
});

// ✅ Main chat endpoint
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  console.log('📨 Incoming user message:', userMessage);

  const messages = [
    { role: 'system', content: "You are a helpful sales assistant for a building products company." },
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: messages
      })
    });

    const data = await response.json();
    console.log('🤖 OpenRouter response:', JSON.stringify(data, null, 2));

    if (data.choices && data.choices[0]?.message?.content) {
      res.json({ content: data.choices[0].message.content });
    } else {
      console.warn('⚠️ No valid content from GPT response.');
      res.json({ content: "No valid response from GPT." });
    }
  } catch (error) {
    console.error('🔥 Error during fetch or processing:', error);
    res.status(500).json({ content: "Server error. Please try again later." });
  }
});

// ✅ Start the backend server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
