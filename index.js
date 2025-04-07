import express from 'express'
import { Client, middleware } from '@line/bot-sdk'
import dotenv from 'dotenv'
import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'

dotenv.config()
const app = express()

// ===== LINE 配置 =====
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
}
const client = new Client(config)

// ===== Gemini 配置 =====
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro-preview-03-25' })

// ===== 處理 rawBody for LINE middleware 驗證 =====
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))
app.use(middleware(config))

// ===== Webhook 路由處理 =====
app.post('/webhook', async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent))
    res.status(200).end()
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(500).end()
  }
})

// ===== 處理 LINE 訊息事件，呼叫 Gemini 回覆 =====
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null)
  }

  try {
    const userMessage = event.message.text
    const result = await model.generateContent([`請用繁體中文回答以下問題：${userMessage}`])
    const response = await result.response
    const replyText = response.text()

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: replyText
    })
  } catch (error) {
    console.error('handleEvent error:', error)
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '抱歉，AI 回應失敗了 😢'
    })
  }
}

// ===== 啟動伺服器 =====
const port = process.env.PORT || 10000
app.listen(port, () => {
  console.log(`🚀 Server is running on ${port}`)
})
