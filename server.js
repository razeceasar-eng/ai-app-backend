import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize the official Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Chat Completion Endpoint
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  // System instructions to enforce Raze AI's persona
  const systemInstruction = `You are Raze AI, an elite, highly intelligent tech assistant. 
    
  CORE CAPABILITIES:
  1. Language: You are completely trilingual. You perfectly understand and can respond in English, Tagalog, and Bisaya (Cebuano). You can easily handle mix-languages like Taglish or Bislish. Always reply using the same language blend the user uses.
  2. Tech Expertise: Your primary function is to solve tech problems from basic (router setup, password recovery) to advanced (coding in JS/Python/C++, debugging architecture, cloud infrastructure).

  TONE: Brilliant, helpful, and clear. Break down simple tasks into steps; provide precise, production-ready code for advanced tasks.`;

  try {
    // 1. Filter out any system prompts injected by the client for security
    const cleanMessages = messages.filter(m => m.role !== 'system');

    // 2. Separate the very last message (the new prompt) from the history
    const lastMessage = cleanMessages[cleanMessages.length - 1];
    if (!lastMessage) {
      return res.status(400).json({ error: 'No user messages found.' });
    }

    // 3. Convert older messages into Gemini's history format 
    // (Maps OpenAI/Groq roles 'user' -> 'user' and 'assistant' -> 'model')
    const history = cleanMessages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // 4. Initialize the multi-turn chat session using the Free Tier Flash model
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash', 
      history: history,
      config: {
        systemInstruction: systemInstruction
      }
    });

    // 5. Send the latest user message
    const result = await chat.sendMessage({
      message: lastMessage.content
    });

    res.json({ reply: result.text });
  } catch (error) {
    console.error('Gemini API Error:', error);
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

app.get('/health', (req, res) => res.send('Raze AI Backend Operational'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
