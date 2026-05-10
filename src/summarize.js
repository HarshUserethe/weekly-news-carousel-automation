require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const OpenAI = require('openai');
const logger = require('./utils/logger');
const config = require('../config.json');

const HEADLINE_MAX = 55;  // characters
const SUMMARY_MAX = 180; // characters

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Hard truncate with ellipsis — last resort only
 */
function hardTruncate(text, max) {
  if (!text) return '';
  return text.length <= max ? text : text.substring(0, max - 1) + '…';
}

/**
 * Ask GPT to produce a short headline, summary, and category.
 * Returns { headline, summary, category } all within char limits.
 */
async function summarizeWithOpenAI(article) {
  const prompt = `You are a professional news editor for a local city news app. Summarize the article below.

Return ONLY a valid JSON object — no markdown, no explanation, no extra text.

Rules:
- "headline": max ${HEADLINE_MAX} characters. Catchy, clear, no trailing "...".
- "summary": max ${SUMMARY_MAX} characters. Plain English, captures the key facts.
- "category": exactly one word (e.g. Politics, Crime, Infrastructure, Sports, Health, Environment, Business, Education, Local).

Article:
Title: ${article.title}
Description: ${article.description || ''}
Content: ${article.content || ''}

Return format:
{"headline": "...", "summary": "...", "category": "..."}`;

  const response = await openai.chat.completions.create({
    model: config.openaiModel || 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 300,
    temperature: 0.4 // Lower = more consistent, factual output
  });

  const raw = response.choices[0].message.content;

  // Strip accidental markdown fences just in case
  const clean = raw.replace(/```json|```/g, '').trim();

  const parsed = JSON.parse(clean);

  // Safety net: hard truncate if GPT still goes over
  return {
    headline: hardTruncate(parsed.headline || article.title, HEADLINE_MAX),
    summary: hardTruncate(parsed.summary || article.description, SUMMARY_MAX),
    category: parsed.category || 'Update'
  };
}

async function summarizeNews() {
  try {
    logger.info('Starting news summarization with OpenAI');

    const rawPath = path.join(__dirname, '../raw-news.json');
    const rawData = await fs.readFile(rawPath, 'utf8');
    const articles = JSON.parse(rawData);

    const processedArticles = [];

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      logger.info(`Summarizing article ${i + 1}/${articles.length}: "${article.title?.substring(0, 45)}..."`);

      try {
        const { headline, summary, category } = await summarizeWithOpenAI(article);

        logger.info(`  ✔ headline: ${headline.length} chars | summary: ${summary.length} chars`);

        processedArticles.push({
          id: i + 1,
          headline,
          summary,
          category,
          imageUrl: article.urlToImage,
          sourceUrl: article.url,
          date: article.publishedAt
        });

      } catch (err) {
        // If OpenAI fails for one article, fall back to hard truncation so the
        // rest of the pipeline still works
        logger.warn(`OpenAI failed for article ${i + 1}: ${err.message} — using hard truncation`);

        processedArticles.push({
          id: i + 1,
          headline: hardTruncate(article.title, HEADLINE_MAX),
          summary: hardTruncate(article.description || article.content || article.title, SUMMARY_MAX),
          category: 'Update',
          imageUrl: article.urlToImage,
          sourceUrl: article.url,
          date: article.publishedAt
        });
      }
    }

    const outputPath = path.join(__dirname, '../processed-news.json');
    await fs.writeFile(outputPath, JSON.stringify(processedArticles, null, 2));

    logger.info(`Saved ${processedArticles.length} processed articles to processed-news.json`);

    return processedArticles;
  } catch (error) {
    logger.error(`Error summarizing news: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  summarizeNews();
}

module.exports = summarizeNews;