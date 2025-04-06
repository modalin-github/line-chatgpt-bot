const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);
app.use(middleware(config));

app.post('/webhook', async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).end();
  }
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const models = [
    {
      name: 'openchat',
      model: 'openchat/openchat-3.5-0106',
      key: process.env.OPENROUTER_API_KEY_1,
    },
    {
      name: 'mytho',
      model: 'gryphe/mythomax-l2-13b',
      key: process.env.OPENROUTER_API_KEY_2,
    },
    {
      name: 'mistral',
      model: 'mistralai/mistral-7b-instruct',
      key: process.env.OPENROUTER_API_KEY_3,
    }
  ];

  let reply = null;
  for (let m of models) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: m.model,
          messages: [{ role: 'user', content: event.message.text }]
        },
        {
          headers: {
            Authorization: `Bearer ${m.key}`,
            'Content-Type': 'application/json',
          },
        }
      );

      reply = response.data.choices[0].message.content;
      console.log(`✅ 使用模型 ${m.name} 回覆成功`);
      break; // 成功就跳出
    } catch (err) {
      console.error(`❌ 模型 ${m.name} 錯誤:`, err.response?.data || err.message);
    }
  }

  if (!reply) reply = '抱歉，目前 AI 回應失敗了 😢';

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: reply,
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
