const config = require("../config");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const puppeteer = require("puppeteer");
const path = require('path');

function trigger(msg) {
  return /@standings/i.test(msg.text);
}

async function respond(msg) {
  try {
    const url =
      "https://thefantasynascarleague.com/fantasy_nascar.php?year=2025"; // replace with actual page URL
    const screenshotPath = "standings.png";

    console.log('Capturing screenshot...');
    await captureStandings(url, screenshotPath);

    console.log('Uploading to GroupMe...');
    const imageUrl = await uploadImageToGroupMe(screenshotPath);

    console.log('Posting to group...');
    await postImageToGroup(imageUrl);

    console.log("Screenshot posted to GroupMe!");
  } catch (err) {
    console.error(err);
  }
}

async function captureStandings(url, outputPath = 'standings.png') {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium', // Required for Docker (Render)
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.click('a[href="#tab3"]');
    await page.waitForSelector('.standings', { visible: true, timeout: 10000 });

    const element = await page.$('.standings');
    if (!element) throw new Error('❌ Could not find .standings element');

    await page.evaluate(() => {
      const el = document.querySelector('.standings');
      el?.scrollIntoView();

      if (el) {
        el.style.padding = '20px 15px';
      }
    });

    await element.screenshot({ path: outputPath });
    return outputPath;

  } catch (err) {
    console.error('❌ Error during capture:', err.message);
  } finally {
    await browser.close();
  }
}

async function uploadImageToGroupMe(imagePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(imagePath));

  const response = await axios.post('https://image.groupme.com/pictures', form, {
    headers: {
      ...form.getHeaders(),
      'X-Access-Token': config.ACCESS_TOKEN,
    },
  });

  return response.data.payload.picture_url;
}

async function postImageToGroup(imageUrl) {
  await axios.post('https://api.groupme.com/v3/bots/post', {
    bot_id: config.BOT_ID,
    text: '', // you can add a caption here
    picture_url: imageUrl,
  });
}

exports.trigger = trigger;
exports.respond = respond;
