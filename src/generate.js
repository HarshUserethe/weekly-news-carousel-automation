const puppeteer = require('puppeteer');
const fs = require('fs/promises');
const path = require('path');
const logger = require('./utils/logger');
const config = require('../config.json');

async function generateSlides() {
  try {
    logger.info('Starting slide generation');
    
    const processedPath = path.join(__dirname, '../processed-news.json');
    const processedData = await fs.readFile(processedPath, 'utf8');
    const articles = JSON.parse(processedData);
    
    const templatePath = path.join(__dirname, 'templates', 'slide.html');
    const templateHtml = await fs.readFile(templatePath, 'utf8');
    
    const outputDir = path.join(__dirname, '../output');
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (e) {}

    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({
      width: config.outputDimensions.width,
      height: config.outputDimensions.height,
      deviceScaleFactor: 2
    });

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      logger.info(`Generating slide ${i + 1}/${articles.length}`);
      
      let html = templateHtml
        .replace(/{{FONT_FAMILY}}/g, config.branding.fontFamily)
        .replace(/{{BG_START}}/g, config.branding.colors.backgroundStart)
        .replace(/{{BG_END}}/g, config.branding.colors.backgroundEnd)
        .replace(/{{TEXT_COLOR}}/g, config.branding.colors.text)
        .replace(/{{PRIMARY_COLOR}}/g, config.branding.colors.primary)
        .replace(/{{LOGO_TEXT}}/g, config.branding.logoText)
        .replace(/{{INSTAGRAM_HANDLE}}/g, config.instagramHandle)
        .replace(/{{IMAGE_URL}}/g, article.imageUrl)
        .replace(/{{SLIDE_NUM}}/g, i + 1)
        .replace(/{{TOTAL_SLIDES}}/g, articles.length)
        .replace(/{{CATEGORY}}/g, article.category)
        .replace(/{{HEADLINE}}/g, article.headline)
        .replace(/{{SUMMARY}}/g, article.summary);

      // Handle last slide CTA
      if (i === articles.length - 1) {
        html = html.replace('{{CTA_TEXT}}', 'Follow Us');
      } else {
        html = html.replace('{{CTA_TEXT}}', 'Swipe &rarr;');
      }

      await page.setContent(html, { waitUntil: ['networkidle0', 'load', 'domcontentloaded'] });
      
      const outputPath = path.join(outputDir, `slide-${i + 1}.png`);
      await page.screenshot({ path: outputPath });
    }
    
    await browser.close();
    logger.info(`Successfully generated ${articles.length} slides in output/ directory`);
    return { success: true, count: articles.length };
  } catch (error) {
    logger.error(`Error generating slides: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  generateSlides();
}

module.exports = generateSlides;
