require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const { startOfWeek, isAfter } = require('date-fns');
const axios = require('axios');

const logger = require('./utils/logger');
const config = require('../config.json');

const GNEWS_API_KEY =
  process.env.GNEWS_API_KEY || 'default-example-api-key';
const GNEWS_BASE_URL = 'https://gnews.io/api/v4/search';

/**
 * Fetch city-specific news from GNews API and save to raw-news.json.
 * No AI trimming here — summarize.js handles all text shaping downstream.
 */
async function fetchNews() {
  try {
    logger.info(`Starting GNews fetch for city: ${config.city}`);

    const now = new Date();

    // Monday = start of current week
    const monday = startOfWeek(now, { weekStartsOn: 1 });

    logger.info(`Filtering news from Monday (${monday.toISOString()})`);

    const count = config.slideCount || 5;

    const params = {
      q: config.city,        // City name — keeps results city-specific
      lang: 'en',
      max: 20,               // Fetch extra to allow filtering by date
      sortby: 'publishedAt', // Newest first
      apikey: GNEWS_API_KEY
    };

    logger.info(`GNews API query: "${config.city}"`);

    const response = await axios.get(GNEWS_BASE_URL, {
      params,
      timeout: 10000
    });

    const { articles: gnewsArticles, totalArticles } = response.data;

    logger.info(
      `GNews returned ${gnewsArticles.length} articles (total available: ${totalArticles})`
    );

    // ── Map GNews format → internal format + filter by current week ───────────
    let rawArticles = [];

    for (const item of gnewsArticles) {
      const pubDate = new Date(item.publishedAt);

      if (
        isAfter(pubDate, monday) ||
        pubDate.getTime() === monday.getTime()
      ) {
        rawArticles.push({
          title: item.title,
          description: item.description || item.title,
          urlToImage: item.image || '',
          publishedAt: pubDate.toISOString(),
          content: item.content || item.description || item.title,
          url: item.url,
          source: item.source?.name || ''
        });
      }
    }

    logger.info(`Articles after date filter (this week): ${rawArticles.length}`);

    // Sort newest first
    rawArticles.sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    );

    // ── Deduplicate by title ───────────────────────────────────────────────────
    const uniqueArticles = [];
    const titles = new Set();

    for (const article of rawArticles) {
      // Strip trailing source name (e.g. "Title - Source Name")
      const cleanTitle =
        article.title.split(' - ').slice(0, -1).join(' - ') ||
        article.title;

      const normalizedTitle = cleanTitle.toLowerCase().trim();

      if (normalizedTitle && !titles.has(normalizedTitle)) {
        titles.add(normalizedTitle);
        article.title = cleanTitle;
        uniqueArticles.push(article);
      }
    }

    logger.info(`Unique articles after dedup: ${uniqueArticles.length}`);

    // Take only the top N articles per config
    const topArticles = uniqueArticles.slice(0, count);

    // ── Fallback image pass ───────────────────────────────────────────────────
    for (const article of topArticles) {
      if (
        !article.urlToImage ||
        article.urlToImage.includes('googleusercontent') ||
        article.urlToImage.includes('gstatic') ||
        article.urlToImage.includes('favicon') ||
        article.urlToImage.includes('logo')
      ) {
        article.urlToImage =
          `https://picsum.photos/seed/` +
          `${encodeURIComponent(article.title.substring(0, 15))}/1080/1080`;

        logger.warn(
          `No valid image for "${article.title.substring(0, 40)}..." — using fallback`
        );
      } else {
        logger.info(`Image OK: "${article.title.substring(0, 40)}..."`);
      }
    }

    // ── Save output ───────────────────────────────────────────────────────────
    const outputPath = path.join(__dirname, '../raw-news.json');

    await fs.writeFile(outputPath, JSON.stringify(topArticles, null, 2));

    logger.info(`Saved ${topArticles.length} articles to raw-news.json`);

    return topArticles;
  } catch (error) {
    if (error.response) {
      logger.error(
        `GNews API error ${error.response.status}: ${JSON.stringify(error.response.data)}`
      );
    } else {
      logger.error(`Error fetching news: ${error.message}`);
    }

    process.exit(1);
  }
}

if (require.main === module) {
  fetchNews();
}

module.exports = fetchNews;