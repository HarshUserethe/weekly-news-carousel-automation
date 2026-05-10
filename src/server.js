require('dotenv').config();
const express = require('express');
const logger = require('./utils/logger');
const fetchNews = require('./fetchNews');
const summarizeNews = require('./summarize');
const generateSlides = require('./generate');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/run', async (req, res) => {
  logger.info('Manual pipeline trigger received via API');
  
  res.status(202).json({ message: 'Pipeline execution started' });
  
  try {
    await fetchNews();
    await summarizeNews();
    await generateSlides();
    logger.info('Manual pipeline completed successfully');
  } catch (error) {
    logger.error(`Manual pipeline failed: ${error.message}`);
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
