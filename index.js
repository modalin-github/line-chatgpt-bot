import express from 'express';
import { Client, middleware } from '@line/bot-sdk';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const app = express();

// LINE Bot 設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

// Middleware
app.use(middleware(config));
app.use(express.json()); // 確保可以解析 JSON 請求

// Webhook 接收點
app.post('/webhook', async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).end();
  }
});

// 處理訊息事件
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  try {
    // 使用 Gemini API 回覆訊息
    const geminiReply = await callGeminiAPI(event.message.text);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: geminiReply,
    });
  } catch (err) {
    console.error('Reply error:', err);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '抱歉，AI 回應失敗了 😢',
    });
  }
}

// 呼叫 Gemini API
async function callGeminiAPI(userInput) {
  const apiKey = process.env.GEMINI_API_KEY;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

  const response = await axios.post(endpoint, {
    contents: [
      {
        parts: [{ text: userInput }],
      },
    ],
  });

  const candidates = response.data.candidates;
  if (candidates && candidates.length > 0) {
    return candidates[0].content.parts[0].text;
  } else {
    return '抱歉，我沒有理解你的意思。';
  }
}

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
