const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();
const app = express();

// 設定 LINE Channel 金鑰
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// 初始化 LINE 客戶端
const client = new Client(config);

// 監聽 Webhook 路由並加上 middleware 驗證
app.post('/webhook', middleware(config), async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).end();
  }
});

// 處理收到的 LINE 訊息
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  // 傳送訊息至 OpenRouter.ai
  return axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: event.message.text }],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  )
    .then((response) => {
      const reply = response.data.choices[0].message.content;
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: reply,
      });
    })
    .catch((err) => {
      console.error('OpenRouter Error:', err.response?.data || err.message);
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '抱歉，AI 回應失敗了 🥺',
      });
    });
}

// 啟動 Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
