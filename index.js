import express from 'express';
import { Client, middleware } from '@line/bot-sdk';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();

// LINE 設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// 初始化 LINE 客戶端
const client = new Client(config);

// Webhook 接收 POST，記得加上 middleware！
app.post('/webhook', middleware(config), async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).end();
  }
});

// 處理 LINE 訊息事件
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  try {
    const reply = await callGeminiAPI(event.message.text); // 自己定義 callGeminiAPI
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: reply,
    });
  } catch (err) {
    console.error('Gemini API error:', err);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '⚠️ 抱歉，AI 回應失敗了',
    });
  }
}

// Gemini API 調用邏輯
async function callGeminiAPI(userText) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  const apiKey = process.env.GEMINI_API_KEY;

  const response = await axios.post(
    `${url}?key=${apiKey}`,
    {
      contents: [
        {
          parts: [{ text: `請用繁體中文回答使用者問題：「${userText}」` }],
        },
      ],
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.candidates[0].content.parts[0].text;
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
