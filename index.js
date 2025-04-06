import express from 'express'
import { Client, middleware } from '@line/bot-sdk'
import dotenv from 'dotenv'
import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'

dotenv.config()
const app = express()

// LINE Bot 設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
}
const client = new Client(config)

// 初始化 Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// 解析 JSON，保留原始 Buffer 給 LINE 驗證簽章
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))

// 放在 JSON middleware 之後
app.use(middleware(config))

// Webhook 入口
app.post('/webhook', async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent))
    res.status(200).end()
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(500).end()
  }
})

// 處理每則 LINE 訊息
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null)
  }

  const userMessage = event.message.text

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    const result = await model.generateContent(userMessage)
    const replyText = result.response.text()

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: replyText,
    })
  } catch (error) {
    console.error('Gemini 回覆錯誤:', error)
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '抱歉，我無法理解這個問題 😢',
    })
  }
}

// 啟動伺服器
const port = process.env.PORT || 10000
app.listen(port, () => {
  console.log(`Server running on ${port}`)
})
