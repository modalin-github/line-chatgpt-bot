import express from 'express';
import { Client, middleware } from '@line/bot-sdk';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new Client(config);
app.use(middleware(config));

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end(); // LINE 要求 200 OK
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).end();
  }
});

// Gemini 回覆邏輯
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  try {
    const geminiReply = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [
          {
            parts: [{ text: `請用繁體中文回答以下問題：${event.message.text}` }]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          key: process.env.GEMINI_API_KEY
        }
      }
    );

    const text = geminiReply.data.candidates?.[0]?.content?.parts?.[0]?.text || '抱歉，我無法理解您的問題 😅';

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: text
    });
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '出錯了，AI 沒有回應 😢'
    });
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
