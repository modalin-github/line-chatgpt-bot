import express from 'express'
import { Client, middleware } from '@line/bot-sdk'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()
const app = express()

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
}

const client = new Client(config)

// 使用 JSON 中介處理器（重要：支援 Buffer 驗證）
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))

// 放在 JSON middleware 之後，使用 LINE 的 middleware 驗證簽章
app.use(middleware(config))

// webhook handler
app.post('/webhook', async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent))
    res.status(200).end()
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(500).end()
  }
})

// 處理 LINE 訊息事件
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null)
  }

  try {
    const userMessage = event.message.text
    const replyText = `你剛剛說的是：「${userMessage}」` // 範例回應

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: replyText
    })
  } catch (error) {
    console.error('handleEvent error:', error)
  }
}

const port = process.env.PORT || 10000
app.listen(port, () => {
  console.log(`Server running on ${port}`)
})
