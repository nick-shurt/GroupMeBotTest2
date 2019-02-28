const config = require('../config');
const bot = require('../bot')
const rp = require('request-promise');

function trigger(msg) {
	return /@gif/i.test(msg.text);
}

async function respond(msg) {
	let search = msg.text.replace(/.*@gif/i, '').trim();

	try {
		let resp = await rp({
			method: 'GET',
			url: `http://api.giphy.com/v1/gifs/5pUGvckBvGSNvDOInk?api_key=${config.GIHPY_KEY}`,
			json: true
		});
		if(resp.data.length) {
			let gif = Math.floor(Math.random() * Math.min(resp.data.length, 10));
			bot.postMsg('https://media.giphy.com/media/5pUGvckBvGSNvDOInk/giphy.gif')
		} else {
			console.log('No gifs for: ' + search);
		}
	} catch(err) {
		console.error(err);
	}
}

exports.trigger = trigger;
exports.respond = respond;
