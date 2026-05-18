import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Chat Completion Endpoint
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  // THIS IS THE BRAIN: Trilingual Tech Expert Prompt
  const systemPrompt = { 
    role: 'system', 
    content: `You are Samsung Brilliant AI, an elite, highly intelligent tech assistant. 
    
    CORE CAPABILITIES:
    1. Language: You are completely trilingual. You perfectly understand and can respond in English, Tagalog, and Bisaya (Cebuano). You can easily handle mix-languages like Taglish or Bislish. Always reply using the same language blend the user uses.
    2. Tech Expertise: Your primary function is to solve tech problems from basic (router setup, password recovery) to advanced (coding in JS/Python/C++, debugging architecture, cloud infrastructure).

    TONE: Brilliant, helpful, and clear. Break down simple tasks into steps; provide precise, production-ready code for advanced tasks.`
  };

  // Security: Remove any system prompts from the frontend and force our secure one
  const cleanMessages = messages.filter(m => m.role !== 'system');
  const messagesToSend = [systemPrompt, ...cleanMessages];

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: messagesToSend,
      model: 'llama-3.3-70b-versatile',
    });

    const reply = chatCompletion.choices[0]?.message?.content || '';
    res.json({ reply });
  } catch (error) {
    console.error('Groq API Error:', error);
    res.status(500).json({ error: 'Failed to process AI request.' });
  }
});

// Google Family Gateway Log and Route Redirect
app.post('/api/invite-family', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  console.log(`[Google Family Request] Intent registered to invite: ${email}`);
  
  res.json({
    success: true,
    message: `Redirecting to Google Family Hub to add ${email}`,
    googleLink: 'https://families.google.com/'
  });
});

app.get('/health', (req, res) => res.send('Samsung Brilliant AI Backend Operational'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
