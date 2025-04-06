const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const axios = require('axios');
require('dotenv').config();

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

app.use(middleware(config));

// 處理 webhook
app.post('/webhook', async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end(); // 成功回 200 給 LINE 平台
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).end();
  }
});

// 處理每一則訊息
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  // 使用 OpenRouter 轉發訊息
  return axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: 'mistralai/mistral-7b-instruct', // 可自行更換模型
    messages: [{ role: 'user', content: event.message.text }],
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://your-project-name.onrender.com', // 改成你的專案網址
    }
  }).then(response => {
    const reply = response.data.choices[0].message.content;
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: reply,
    });
  }).catch(err => {
    console.error('OpenRouter Error:', err.response?.data || err.message);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '抱歉，AI 回應失敗了 😢',
    });
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
