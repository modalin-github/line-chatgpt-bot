import express from 'express'
import { Client, middleware } from '@line/bot-sdk'
import dotenv from 'dotenv'
import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'

dotenv.config()
const app = express()

// ===== LINE 設定 =====
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
}
const client = new Client(config)

// ===== Gemini 設定 =====
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

// ===== 設定 rawBody 支援 LINE middleware 驗證 =====
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))

// ===== 套用 LINE middleware 驗證簽名 =====
app.use(middleware(config))

// ===== webhook handler =====
app.post('/webhook', async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent))
    res.status(200).end()
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(500).end()
  }
})

// ===== 處理 LINE 訊息事件 =====
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null)
  }

  const userMessage = event.message.text

  try {
    const prompt = `請用繁體中文回答以下問題：\n${userMessage}`
    const result = await model.generateContent([prompt])
    const replyText = result.response.text().trim()

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

// ===== 設定埠號 =====
const port = process.env.PORT || 10000
app.listen(port, () => {
  console.log(`Server running on ${port}`)
})
