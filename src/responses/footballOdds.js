const config = require("../config");
const bot = require("../bot");
const rp = require("request-promise");

function trigger(msg) {
  return /@odds/i.test(msg.text);
}

async function respond(msg) {
  let search = msg.text.replace(/.*@odds/i, "").trim();
  console.log('MSG: ' + search);

  /*try {
    let resp = await rp({
      method: "GET",
      url: `http://api.giphy.com/v1/gifs/search?q=${search}&api_key=${
        config.GIHPY_KEY
      }`,
      json: true
    });
    if (resp.data.length) {
      let gif = Math.floor(Math.random() * Math.min(resp.data.length, 10));
      setTimeout(function() {
        bot.postMsg(resp.data[gif].images.fixed_height.url);
      }, 1000);
    } else {
      console.log("No gifs for: " + search);
    }
  } catch (err) {
    console.error(err);
  }*/
}

exports.trigger = trigger;
exports.respond = respond;