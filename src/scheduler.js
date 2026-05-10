require('dotenv').config();
const cron = require('node-cron');
const logger = require('./utils/logger');
const config = require('../config.json');
const fetchNews = require('./fetchNews');
const summarizeNews = require('./summarize');
const generateSlides = require('./generate');

async function runPipeline() {
  try {
    logger.info('Starting scheduled news automation pipeline');
    await fetchNews();
    await summarizeNews();
    await generateSlides();
    logger.info('Scheduled pipeline completed successfully');
  } catch (error) {
    logger.error(`Pipeline failed: ${error.message}`);
  }
}

const scheduleExp = config.schedule || '0 8 * * 0';
const timezone = config.timezone || 'Asia/Kolkata';

logger.info(`Initializing scheduler with cron: "${scheduleExp}" in timezone: ${timezone}`);

cron.schedule(scheduleExp, () => {
  logger.info('Cron job triggered');
  runPipeline();
}, {
  scheduled: true,
  timezone: timezone
});

logger.info('Scheduler is now running...');
