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

// 驗證 Webhook 簽名
app.use(middleware(config));

// Webhook 路由
app.post('/webhook', async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end(); // 回傳 200 OK
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).end();
  }
});

// 處理事件
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  // Gemini API 請求
  try {
    const prompt = `請用繁體中文回答以下問題：${event.message.text}`;

    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        },
      }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '抱歉，AI 沒有回應到 😥';
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: reply,
    });
  } catch (error) {
    console.error('Gemini Error:', error.response?.data || error.message);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '抱歉，AI 回應失敗了 😢',
    });
  }
}

// 伺服器監聽
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
