const config = require("../config");
const bot = require("../bot");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

function trigger(msg) {
  return /@standings/i.test(msg.text);
}

async function respond(msg) {
  try {
    const url = "https://thefantasynascarleague.com/fantasy_nascar.php?year=2025"; // replace with actual page URL
    const screenshotPath = "standings.png";

    await captureStandings(url, screenshotPath);
    const imageUrl = await uploadImageToGroupMe(screenshotPath);
    await postImageToGroup(imageUrl);
    console.log("Screenshot posted to GroupMe!");
  } catch (err) {
    console.error(err);
  }
}

async function captureStandings(url, outputPath = 'standings.png') {
  const browser = await puppeteer.launch({
    headless: 'new', // or false if debugging
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });

  const element = await page.$('.standings');
  if (!element) {
    throw new Error('Could not find .standings element on the page');
  }

  await element.screenshot({ path: outputPath });
  await browser.close();
}

async function uploadImageToGroupMe(imagePath) {
  const form = new FormData();
  form.append("file", fs.createReadStream(imagePath));

  const response = await axios.post(
    "https://image.groupme.com/pictures",
    form,
    {
      headers: {
        ...form.getHeaders(),
        "X-Access-Token": config.ACCESS_TOKEN, // not bot token; this is your personal token
      },
    }
  );

  return response.data.payload.picture_url;
}

async function postImageToGroup(imageUrl) {
  await axios.post("https://api.groupme.com/v3/bots/post", {
    bot_id: config.BOT_ID,
    text: "", // text is optional
    picture_url: imageUrl,
  });
}

exports.trigger = trigger;
exports.respond = respond;
