const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const axios = require('axios');
require('dotenv').config();

const app = express();

// 設定 LINE 機器人基本資訊
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new Client(config);

// 處理 LINE webhook
app.post('/webhook', middleware(config), async (req, res) => {
  Promise.all(req.body.events.map(handleEvent)).then((result) => res.json(result));
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  // 使用 ChatGPT 回應文字訊息
  const userMessage = event.message.text;
  const reply = await askChatGPT(userMessage);

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: reply,
  });
}

// 呼叫 OpenAI API
async function askChatGPT(message) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }]
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data.choices[0].message.content.trim();
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
