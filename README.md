# LINE ChatGPT Bot (Node.js + Render)

這是一個可以部署在 Render 上的 LINE 官方帳號串接 ChatGPT 的專案。

## 🧰 技術堆疊
- Node.js + Express
- LINE Messaging API
- OpenAI ChatGPT API
- Render 免費伺服器部署

## 📁 專案結構
- `index.js`：主伺服器程式
- `.env`：放入金鑰（上傳前請勿公開）
- `.env.example`：範例格式
- `README.md`：使用教學

## 🔧 環境變數 `.env` 格式


## 🚀 Render 部署教學
1. 登入 [Render](https://render.com)
2. 建立 Web Service → 連結 GitHub 倉庫
3. Build Command: `npm install`
4. Start Command: `node index.js`
5. 加入上述環境變數
6. 獲得 Webhook 網址後，貼回 LINE Developers

## 📬 Webhook URL
設定成你的 Render 網址 + `/webhook` 路徑
