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

// 初始化 LINE Bot 客戶端
const client = new Client(config);

// 加入 LINE middleware 驗證
app.use(middleware(config));

// Webhook 接收點
app.post('/webhook', async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end(); // ✅ LINE 要求 200 回應
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).end();
  }
});

// 處理 LINE 傳入事件
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userMessage = event.message.text;

  try {
    // 呼叫 Gemini Pro API
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{ parts: [{ text: userMessage }] }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        },
      }
    );

    const replyText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '抱歉，我無法理解你的訊息。';

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: replyText,
    });
  } catch (error) {
    console.error('Gemini Error:', error?.response?.data || error.message);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '抱歉，AI 回應失敗了 😢',
    });
  }
}

// 設定 port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
