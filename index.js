// LINE x ChatGPT 可部署專案（Node.js + Express + Render）
// 請將此專案上傳至 GitHub，然後用 Render 建立 Web Service

const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// LINE 機器人設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

app.post('/webhook', line.middleware(config), async (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then(() => res.status(200).end())
    .catch((err) => {
      console.error('Webhook Error:', err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const userMessage = event.message.text;

  // 呼叫 OpenAI API
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: userMessage }],
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const replyText = response.data.choices[0].message.content.trim();

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: replyText,
    });
  } catch (error) {
    console.error('ChatGPT error:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '很抱歉，ChatGPT 暫時無法回覆。',
    });
  }
}

// Render 啟動用預設 PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
