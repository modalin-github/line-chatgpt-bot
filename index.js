import express from 'express';
import { Client, middleware } from '@line/bot-sdk';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();

// 設定 LINE Bot 的憑證資訊
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

// 初始化 LINE Bot 客戶端
const client = new Client(config);

// 加入 middleware 驗證簽章
app.use(middleware(config));

// 接收 Webhook 的 POST 請求
app.post('/webhook', async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end(); // ✅ LINE 伺服器需要收到 200 OK
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).end();
  }
});

// 處理 LINE 傳來的事件
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  // 使用 Gemini API 回覆
  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{
          parts: [{ text: `請用繁體中文回答：${event.message.text}` }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          key: process.env.GEMINI_API_KEY
        }
      }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '無回應內容';

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: reply
    });

  } catch (err) {
    console.error('Gemini API Error:', err.response?.data || err.message);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '抱歉，AI 回應失敗了 😢'
    });
  }
}

// Render 預設會給定 process.env.PORT
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running on ${port}`);
});
