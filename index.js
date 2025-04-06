const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();

// ✅ 加上 JSON 解析，確保 middleware 可讀取 request body
app.use(express.json());

// LINE Bot 設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

// 初始化 LINE 客戶端
const client = new Client(config);

// ✅ 使用 LINE middleware（需在 JSON parser 後）
app.use(middleware(config));

// Webhook 接收事件
app.post('/webhook', async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end(); // 告知 LINE 收到請求
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).end();
  }
});

// 處理 LINE 事件
async function handleEvent(event) {
  // 僅處理文字訊息
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userMessage = event.message.text;

  try {
    // Gemini API 請求
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        contents: [{
          parts: [{ text: userMessage }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const replyText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '抱歉，AI 沒有回應內容。';

    // 回覆使用者訊息
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: replyText
    });
  } catch (error) {
    console.error('Gemini 回應錯誤:', error);
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '抱歉，AI 回應失敗了 😢'
    });
  }
}

// 啟動伺服器
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
