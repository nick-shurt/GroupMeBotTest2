const bot = require("../bot");

function trigger(msg) {
  return /wins pool standings/i.test(msg.text);
}

async function respond(msg) {
  try {
    setTimeout(function() {
        bot.postMsg("https://docs.google.com/spreadsheets/d/1Vtpz-qxfmympSoEwsnqZSL79odxMmxC1fWP21U7m_fM/edit?usp=sharing");
    }, 1000);
  } catch (err) {
    console.error(err);
  }
}

exports.trigger = trigger;
exports.respond = respond;