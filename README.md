# 🏙️ Local News Instagram Carousel Generator

A production-ready Node.js automation system designed to fetch local city news, summarize the stories using OpenAI, and generate stunning, modern "Glassmorphism" styled Instagram carousel slides using Puppeteer.

This tool acts as a complete pipeline to keep a localized news Instagram page fully automated, active, and aesthetically top-tier.

---

## ✨ Key Features

- **Automated Content Curation**: Fetches top news articles for any specified city from Monday to the current day, automatically filtering out duplicates.
- **AI-Powered Summarization**: Utilizes OpenAI (GPT-3.5/GPT-4) to extract 25-30 word punchy summaries, craft short headlines, and assign relevant categories.
- **Dynamic Slide Generation**: Transforms the summarized JSON data into beautiful `1080x1350` PNG slides using headless Chrome via Puppeteer. Features premium glassmorphism layouts, dynamic CTAs, and slide progress counters.
- **Flexible Execution**: 
  - **Manual CLI**: Generate on-demand via simple npm scripts.
  - **Cron Scheduler**: Run in the background (default: Every Sunday at 8:00 AM).
  - **API Webhook**: An Express.js endpoint to trigger generation remotely.
- **Highly Configurable**: Rebrand for ANY city, change fonts, models, schedules, or theme colors instantly via `config.json`.
- **Robust Logging**: Production-grade logging using Winston (`logs/combined.log` & `logs/error.log`).

---

## 📋 Prerequisites

Before running the system, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v16.x or higher)
- [npm](https://www.npmjs.com/) (v8.x or higher)
- API Keys:
  - **NewsAPI Key** (from [newsapi.org](https://newsapi.org/))
  - **OpenAI API Key** (from [platform.openai.com](https://platform.openai.com/))

---

## 🚀 Installation

1. **Navigate to the repository directory:**
   ```bash
   cd c:\HARSH\Dev\bhopal-news-carousel
   ```

2. **Install the dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Rename `.env.example` to `.env` and insert your API keys:
   ```env
   NEWS_API_KEY=your_news_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   ```

---

## ⚙️ Configuration (`config.json`)

All operational and stylistic logic is extracted into `config.json`. You can easily duplicate this project and set it up for a different city without touching the underlying logic.

```json
{
  "city": "Bhopal",
  "country": "IN",
  "branding": {
    "colors": {
      "primary": "rgba(79, 70, 229, 0.9)",
      "secondary": "rgba(255, 255, 255, 0.1)",
      "text": "#FFFFFF",
      "backgroundStart": "#0f172a",
      "backgroundEnd": "#1e1b4b"
    },
    "logoText": "City News",
    "fontFamily": "'Inter', sans-serif"
  },
  "instagramHandle": "@BhopalNews",
  "timezone": "Asia/Kolkata",
  "schedule": "0 8 * * 0",
  "slideCount": 5,
  "openaiModel": "gpt-3.5-turbo",
  "outputDimensions": {
    "width": 1080,
    "height": 1350
  }
}
```

---

## 💻 How to Use

You can run the application in three distinct ways depending on your needs.

### 1. Manual Generation (CLI)
Run the entire pipeline sequentially (fetch -> summarize -> generate slides) instantly:
```bash
npm run generate
```
*Note: If you want to run specific parts of the pipeline separately, you can use:*
- `npm run fetch` - Only pulls news data (`raw-news.json`).
- `npm run summarize` - Only runs AI summarization (`processed-news.json`).
- `npm run slides` - Only renders the slides from the processed data.

**Output:** Generated slides will be saved inside the `output/` directory as `slide-1.png`, `slide-2.png`, etc.

### 2. Scheduled Background Automation (Cron)
Leave the script running on a server to automatically execute the generation based on your `config.json` schedule (e.g., Every Sunday at 8:00 AM local time).
```bash
npm run scheduler
```
*Tip: Use a process manager like PM2 (`pm2 start npm --name "news-scheduler" -- run scheduler`) for production server deployments to keep the script alive.*

### 3. API Trigger (Webhook)
Spin up the Express server to manually trigger generation from external automation apps (like Make.com, n8n, Zapier, or a custom frontend).
```bash
npm start
```
**Trigger the generation:**
```http
POST http://localhost:3000/run
```

---

## 📂 Folder Structure

```
.
├── config.json               # Global configuration variables
├── package.json              # App scripts & dependencies
├── .env                      # API Keys (git-ignored)
├── raw-news.json             # Temporary storage for fetched news
├── processed-news.json       # Temporary storage for AI summarized data
├── output/                   # Directory where finalized PNG slides are saved
├── logs/                     # Winston system logs (error & combined)
└── src/
    ├── server.js             # Express API Webhook implementation
    ├── scheduler.js          # Node-Cron background implementation
    ├── fetchNews.js          # News fetching logic
    ├── summarize.js          # OpenAI summarization logic
    ├── generate.js           # Puppeteer HTML-to-Image generation logic
    ├── templates/
    │   └── slide.html        # Premium Glassmorphism HTML/CSS template
    └── utils/
        └── logger.js         # Winston logging configuration
```

---
*Built with ❤️ utilizing Node.js, Express, Puppeteer, and OpenAI.*
