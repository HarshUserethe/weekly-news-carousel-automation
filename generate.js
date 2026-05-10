const fs = require("fs");
const puppeteer = require("puppeteer");

// Load news data
const news = require("./news.json");

// Fallback image if image missing
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb";

// Main async function
(async () => {

  console.log("====================================");
  console.log("Starting Bhopal Carousel Generator");
  console.log("====================================");

  // Create output folder if missing
  if (!fs.existsSync("./output")) {
    fs.mkdirSync("./output");
    console.log("Created output folder");
  }

  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  });

  // Read template HTML
  const templateHtml = fs.readFileSync(
    "./templates/slide.html",
    "utf8"
  );

  console.log(`Found ${news.length} news items`);

  // Generate each slide
  for (let i = 0; i < news.length; i++) {

    const item = news[i];

    console.log(`Generating slide ${i + 1}...`);

    // Dynamic replacements
    let html = templateHtml

      // Headline
      .replace(/{{HEADLINE}}/g, item.headline || "No Headline")

      // Summary
      .replace(/{{SUMMARY}}/g, item.summary || "No Summary")

      // Category
      .replace(/{{CATEGORY}}/g, item.category || "News")

      // Image
      .replace(/{{IMAGE}}/g, item.image || FALLBACK_IMAGE)

      // Slide counter
      .replace(/{{SLIDE_NUMBER}}/g, `${i + 1}/${news.length}`);

    // Create temporary HTML file
    const tempFileName = `temp-slide-${i}.html`;
    const tempFilePath = `${process.cwd()}/${tempFileName}`;

    fs.writeFileSync(tempFilePath, html);

    // Open new page
    const page = await browser.newPage();

    // Instagram portrait dimensions
    await page.setViewport({
      width: 1080,
      height: 1350,
      deviceScaleFactor: 1
    });

    // Load temp HTML
    await page.goto(`file://${tempFilePath}`, {
      waitUntil: "networkidle0"
    });

    // Small delay for fonts/images
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Screenshot output path
    const outputPath = `./output/slide${i + 1}.png`;

    // Capture screenshot
    await page.screenshot({
      path: outputPath,
      fullPage: true
    });

    console.log(`Saved: ${outputPath}`);

    // Close page
    await page.close();

    // Delete temp HTML
    fs.unlinkSync(tempFilePath);

    console.log(`Slide ${i + 1} completed`);
    console.log("------------------------------------");

  } // ✅ FIX 1: for loop closes HERE, before browser.close()

  // ✅ FIX 2: browser.close() is now OUTSIDE the loop
  await browser.close();

  console.log("====================================");
  console.log("All slides generated successfully");
  console.log("====================================");

})();