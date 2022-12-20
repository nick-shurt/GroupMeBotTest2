const config = require("../config");
const bot = require("../bot");
const axios = require('axios');

function trigger(msg) {
  return /@odds/i.test(msg.text);
}

async function respond(msg) {
    let input_team = msg.text.replace(/.*@odds/i, "").trim();
    console.log('MSG: ' + input_team);
    let msgToSend = '';

    const apiKey =  config.ODDS_API_KEY;
    const sportKey = 'americanfootball_nfl' // use the sport_key from the /sports endpoint below, or use 'upcoming' to see the next 8 games across all sports
    const regions = 'us' // uk | us | eu | au. Multiple can be specified if comma delimited
    const markets = 'h2h' // h2h | spreads | totals. Multiple can be specified if comma delimited
    const oddsFormat = 'american' // decimal | american
    const dateFormat = 'iso' // iso | unix

    try {
        axios.get(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds`, {
            params: {
                apiKey,
                regions,
                markets,
                oddsFormat,
                dateFormat,
            }
        })
        .then(response => {
            let results = response.data;
            let remainingPercent = (response.headers['x-requests-used']/500) * 100;
            let roundedPct = Math.round(remainingPercent * 10) / 10;
            let finalPct = roundedPct.toFixed(1);

            results.forEach((result) => {
                var homeTeam = result.home_team.toLowerCase();
                var homePrice;
                var awayTeam = result.away_team.toLowerCase();
                var awayPrice;
                
                if (homeTeam.includes(input_team.toLowerCase())) {
                    result.bookmakers.forEach((book) => {
                        if (book.key === 'fanduel') {
                            if (book.markets[0].outcomes[0].name === result.home_team) {
                                homePrice = book.markets[0].outcomes[0].price;
                                homePrice = (/^\d/.test(homePrice)) ? '+' + homePrice : homePrice;
                            } else {
                                awayPrice = book.markets[0].outcomes[0].price;
                                awayPrice = (/^\d/.test(awayPrice)) ? '+' + awayPrice : awayPrice;
                            }
            
                            if (book.markets[0].outcomes[1].name === result.home_team) {
                                homePrice = book.markets[0].outcomes[1].price;
                                homePrice = (/^\d/.test(homePrice)) ? '+' + homePrice : homePrice;
                            } else {
                                awayPrice = book.markets[0].outcomes[1].price;
                                awayPrice = (/^\d/.test(awayPrice)) ? '+' + awayPrice : awayPrice;
                            }
            
                            msgToSend += 'Away: ' + result.away_team + ' (' + awayPrice + ')\n';
                            msgToSend += 'Home: ' + result.home_team + ' (' + homePrice + ')\n';
                            msgToSend += finalPct;
                        }
                    });
                } else if (awayTeam.includes(input_team.toLowerCase())) {
                    result.bookmakers.forEach((book) => {
                        if (book.key === 'fanduel') {
                            if (book.markets[0].outcomes[0].name === result.home_team) {
                                homePrice = book.markets[0].outcomes[0].price;
                                homePrice = (/^\d/.test(homePrice)) ? '+' + homePrice : homePrice;
                            } else {
                                awayPrice = book.markets[0].outcomes[0].price;
                                awayPrice = (/^\d/.test(awayPrice)) ? '+' + awayPrice : awayPrice;
                            }
            
                            if (book.markets[0].outcomes[1].name === result.home_team) {
                                homePrice = book.markets[0].outcomes[1].price;
                                homePrice = (/^\d/.test(homePrice)) ? '+' + homePrice : homePrice;
                            } else {
                                awayPrice = book.markets[0].outcomes[1].price;
                                awayPrice = (/^\d/.test(awayPrice)) ? '+' + awayPrice : awayPrice;
                            }
            
                            msgToSend += 'Away: ' + result.away_team + ' (' + awayPrice + ')\n';
                            msgToSend += 'Home: ' + result.home_team + ' (' + homePrice + ')\n';
                            msgToSend += finalPct;
                        }
                    });
                }
            });
                
            // Check your usage
            console.log('Remaining requests',response.headers['x-requests-remaining'])
            console.log('Used requests',response.headers['x-requests-used'])

            setTimeout(function() {
                bot.postMsg(msgToSend);
            }, 1000);

        })
        .catch(error => {
            console.log('Error', error)
            console.log(error.response.data)
        })
    } catch (err) {
        console.error(err);
    }
}

exports.trigger = trigger;
exports.respond = respond;
