const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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
app.options('/chat', cors());

// ✅ Optional root route
app.get('/', (req, res) => {
  res.send('✅ Backend is running');
});

// ✅ Main chat endpoint
app.post('/chat', async (req, res) => {
  console.log('📨 Incoming request body:', req.body);
  const userMessage = req.body.message;
  console.log('📨 Incoming user message:', userMessage);

const messages = [
  {
    role: "system",
    content: `
You are SalesChat5000, an AI sales coach for a building products company.
Your goal is to:
- Coach the user (sales rep) on how to respond to customer objections.
- Focus on product QUALITY, BEST-IN-CLASS CUSTOMER SERVICE, and CODE LISTED & RIGOROUSLY TESTED PRODUCTS.
- Give clear, concise coaching with empathy and practical tips.

Here are example objections and good responses (use as inspiration):

1. Customer: "Your product costs too much."
   Response: "I understand price is a concern. Many of our customers choose us because our products are code-listed and rigorously tested, ensuring long-term reliability. Over time, that quality reduces call-backs and replacement costs, which often saves money."
   Coaching Tip: Focus on lifetime value, not initial price.

2. Customer: "I’ve heard the competition is cheaper."
   Response: "They might be cheaper upfront, but we’re proud to back every product with best-in-class customer service. When you need us, we go beyond expectations to solve problems quickly."
   Coaching Tip: Highlight service and support.

3. Customer: "I’m not sure your product is really better."
   Response: "We understand—it’s hard to compare. Our products undergo rigorous testing and meet strict building code standards. That means you’re getting verified performance and safety."
   Coaching Tip: Build trust using certifications and third-party validations.

4. Customer: "I don’t want to switch suppliers."
   Response: "I hear you—switching can be disruptive. That’s why we offer personalized onboarding and support to make transitions smooth, with a dedicated rep available 24/7."
   Coaching Tip: Reduce risk concerns, emphasize support.

5. Customer: "I just don’t have time to talk right now."
   Response: "I respect your time. I can send a quick summary email now, and follow up when it’s convenient. When we connect, I’d love to show how our product quality and customer support can save you time in the long run."
   Coaching Tip: Stay polite, keep the door open, and show empathy.

When a user provides a customer objection, respond with:
1) A model sales response using these coaching principles
2) A short coaching tip (1–2 sentences)
Keep responses short and conversational.
    `,
  },
  { role: "user", content: userMessage },
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
  const fullText = data.choices[0].message.content;
  const [responsePart, coachingPart] = fullText.split("Coaching Tip:");
  res.json({
    response: (responsePart || "").trim(),
    coaching: (coachingPart || "").trim(),
  });
}
 else {
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
  console.log(`🚀 Server running on port ${PORT}`);
});
