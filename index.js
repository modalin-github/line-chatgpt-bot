const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const axios = require('axios');
require('dotenv').config();

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new Client(config);
app.use(middleware(config));

app.post('/webhook', async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end(); // 回傳 200 是關鍵！
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).end();
  }
});

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  // 傳送問題給 OpenRouter
  return axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: 'openchat/openchat-3.5-0106', // 可替換為其他模型 ID
    messages: [
      {
        role: 'system',
        content: '請一律使用繁體中文回答用戶的問題。若內容與中文地區有關，請以台灣為主要參考依據。'
      },
      {
        role: 'user',
        content: event.message.text
      }
    ]
  }, {
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      const reply = response.data.choices[0].message.content;
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: reply
      });
    })
    .catch(err => {
      console.error('OpenRouter Error:', err.response?.data || err.message);
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '抱歉，AI 回應失敗了 🥲'
      });
    });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
