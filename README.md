# Financial Intelligence System

A full-stack banking portal designed to analyze loan risk, track user transactions, and provide an AI-powered financial assistant.

> **Note:** This project has been migrated from a legacy Python (`pip`/Flask) stack to a modern **Node.js + React (`npm`)** architecture. You no longer need Python or `pip` to run or deploy this application.

## 🚀 Tech Stack
* **Frontend**: React, Vite, Recharts, standard CSS.
* **Backend**: Node.js, Express.js.
* **AI Chatbot**: Powered by **Google Gemini 3.6 Flash** (`@google/generative-ai`), strictly trained to function exclusively as a banking and financial advisory assistant.
* **Database**: Local JSON persistence (`portal_store.json`).

---

## 🛠️ Local Development (Step-by-Step)

Since the project uses Node.js, you will use `npm` instead of `pip`.

### 1. Prerequisites
- Install [Node.js](https://nodejs.org/en/) (v18 or higher recommended).
- Get a free [Google Gemini API Key](https://aistudio.google.com/app/apikey) for the AI Chatbot.

### 2. Setup Environment Variables
Create a `.env` file in the root of the project and add your API key:
```env
GEMINI_API_KEY=your_api_key_here
PORT=5000
```

### 3. Install Dependencies
Run the following command from the root directory to install both client and server dependencies:
```bash
npm run install:all
```

### 4. Run Locally
To run the server and client concurrently for development:
```bash
# Terminal 1: Start the Backend (API)
cd server
npm start

# Terminal 2: Start the Frontend (UI)
cd client
npm run dev
```

---

## ☁️ Deployment (Render)

This project is fully configured to be deployed as a single **Web Service** on [Render](https://render.com). 

The `render.yaml` file is already included in the project, so you can deploy via Blueprint, or manually using the settings below.

### Render Dashboard Settings:
1. Create a new **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. **Environment Variables**: 
   - Add `GEMINI_API_KEY` to the Render environment variables under your service settings.
   - *(Optional)* Add `PORT = 5000`.

### ⚠️ Important Note on Free Tier Persistence
If you deploy this application on Render's **Free Tier**, please note that their free instances use an *ephemeral file system*. This means that anytime your Render server restarts (which happens automatically after periods of inactivity or during new deploys), the `portal_store.json` file will reset, and any new user registrations or transactions will be wiped. 

To achieve permanent data persistence on Render, you would need to either:
1. Upgrade to a paid Render plan and attach a **Persistent Disk** to the `/portal_store.json` path.
2. Or migrate `server/store.js` to connect to a cloud database (like MongoDB Atlas or a managed PostgreSQL instance).
