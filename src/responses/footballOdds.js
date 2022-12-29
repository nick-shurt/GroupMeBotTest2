const config = require("../config");
const bot = require("../bot");
const axios = require('axios');
const nodemailer = require('nodemailer');

function trigger(msg) {
  return /@odds/i.test(msg.text);
}

async function respond(msg) {
    let input = msg.text.replace(/.*@odds/i, "").trim();
    let lowerInput = input.toLowerCase();
    let input_split = lowerInput.split(" ");
    let msgToSend = 'No odds found for given input';
    var input_team;

    const nfl_teams = ['Cardinals',
                    'Falcons',
                    'Ravens',
                    'Bills',
                    'Panthers',
                    'Bears',
                    'Bengals',
                    'Browns',
                    'Cowboys',
                    'Broncos',
                    'Lions',
                    'Packers',
                    'Texans',
                    'Colts',
                    'Jaguars',
                    'Chiefs',
                    'Dolphins',
                    'Vikings',
                    'Patriots',
                    'Saints',
                    'Giants',
                    'Jets',
                    'Raiders',
                    'Eagles',
                    'Steelers',
                    'Chargers',
                    '49ers',
                    'Seahawks',
                    'Rams',
                    'Buccaneers',
                    'Titans',
                    'Commanders'
                    ];

    const nba_teams = ['Celtics',
                    'Nets',
                    'Knicks',
                    '76ers',
                    'Raptors',
                    'Warriors',
                    'Clippers',
                    'Lakers',
                    'Suns',
                    'Kings',
                    'Bulls',
                    'Cavaliers',
                    'Pistons',
                    'Pacers',
                    'Bucks',
                    'Mavericks',
                    'Rockets',
                    'Grizzlies',
                    'Hornets',
                    'Spurs',
                    'Hawks',
                    'Pelicans',
                    'Heat',
                    'Magic',
                    'Wizards',
                    'Nuggets',
                    'Timberwolves',
                    'Thunder',
                    'Trail Blazers',
                    'Jazz'
                    ];

    const getSport = (str) => {
        var sport = 'upcoming';
        if (nfl_teams.includes(str)) {
            sport = 'americanfootball_nfl';
        }
        if (nba_teams.includes(str)) {
            sport = 'basketball_nba';
        }
        return sport;
    }

    const getMarket = (str) => {
        var returnStr = 'not found';
        if (str.includes('o/u') || str.includes('over/under') ) {
            returnStr = 'totals';
        }
        if (str.includes('ml') || str.includes('moneyline') ) {
            returnStr = 'h2h';
        }
        if (str.includes('line') || str.includes('spread') ) {
            returnStr = 'spreads';
        }
        return returnStr;
    }
    
    const space = (str, numspace) => {
        const spc = Array(numspace).fill(' ').join('')
        return str+spc
    }

    if (getMarket(input_split[0]) === 'not found') {
        input_team = input_split[0]; 
    } else {
        input_team = input_split[1];
    }
    
    console.log('MSG: ' + input_team);

    const apiKey =  process.env.ODDS_API_KEY;
    const sportKey = getSport(input_team); // use the sport_key from the /sports endpoint below, or use 'upcoming' to see the next 8 games across all sports
    const regions = 'us' // uk | us | eu | au. Multiple can be specified if comma delimited
    const markets = getMarket(lowerInput); // h2h | spreads | totals. Multiple can be specified if comma delimited
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
            let found = false;

            //ml
            if (markets === 'h2h') {
                results.forEach((result) => {
                    var homeTeam = result.home_team.toLowerCase();
                    var homePrice;
                    var awayTeam = result.away_team.toLowerCase();
                    var awayPrice;
                    console.log('DID WE GET HERE 1');
                    if ((homeTeam.includes(input_team.toLowerCase()) || awayTeam.includes(input_team.toLowerCase())) && !found) {
                        console.log('DID WE GET HERE 2');
                        found = true;
                        result.bookmakers.forEach((book) => {
                            console.log('DID WE GET HERE 3');
                            if (book.key === 'fanduel') {
                                console.log('DID WE GET HERE 4');
                                if (book.markets[0].outcomes[0].name === result.home_team) {
                                    console.log('DID WE GET HERE 5');
                                    homePrice = book.markets[0].outcomes[0].price;
                                    homePrice = (/^\d/.test(homePrice)) ? '+' + homePrice : homePrice;
                                } else {
                                    console.log('DID WE GET HERE 5');
                                    awayPrice = book.markets[0].outcomes[0].price;
                                    awayPrice = (/^\d/.test(awayPrice)) ? '+' + awayPrice : awayPrice;
                                }
                
                                if (book.markets[0].outcomes[1].name === result.home_team) {
                                    console.log('DID WE GET HERE 6');
                                    homePrice = book.markets[0].outcomes[1].price;
                                    homePrice = (/^\d/.test(homePrice)) ? '+' + homePrice : homePrice;
                                } else {
                                    console.log('DID WE GET HERE 6');
                                    awayPrice = book.markets[0].outcomes[1].price;
                                    awayPrice = (/^\d/.test(awayPrice)) ? '+' + awayPrice : awayPrice;
                                }
                
                                msgToSend += 'Away: ' + result.away_team + ' (' + awayPrice + ')\n';
                                msgToSend += 'Home: ' + result.home_team + ' (' + homePrice + ')\n';
                                msgToSend += '\n';
                                msgToSend += '*Odds are from FanDuel';
                            }
                        });
                    }
                });
            }

            // o/u
            if (markets === 'totals') {
                results.forEach((result) => {
                    var homeTeam = result.home_team.toLowerCase();
                    var awayTeam = result.away_team.toLowerCase();
                    var o_uNum;
                    var overOdds;
                    var underOdds;

                    if ((homeTeam.includes(input_team.toLowerCase()) || awayTeam.includes(input_team.toLowerCase())) && !found) {
                        found = true;
                        result.bookmakers.forEach((book) => {
                            if (book.key === 'fanduel') {
                                o_uNum = book.markets[0].outcomes[0].point;
                                if (book.markets[0].outcomes[0].name === 'Over') {
                                    overOdds = book.markets[0].outcomes[0].price;
                                } else {
                                    underOdds = book.markets[0].outcomes[0].price;
                                }

                                if (book.markets[0].outcomes[1].name === 'Under') {
                                    underOdds = book.markets[0].outcomes[1].price;
                                } else {
                                    overOdds = book.markets[0].outcomes[1].price;
                                }

                                var awayToEdit = result.away_team;
                                var homeToEdit = result.home_team;

                                if (homeToEdit.length > awayToEdit.length) {
                                    awayToEdit = space(awayToEdit, homeToEdit.length - awayToEdit.length);
                                } else {
                                    homeToEdit = space(homeToEdit, awayToEdit.length - homeToEdit.length);
                                }

                                msgToSend += 'Away: ' + awayToEdit + '     o' + o_uNum + ' (' + overOdds + ')\n';
                                msgToSend += 'Home: ' + homeToEdit + '     u' + o_uNum + ' (' + underOdds + ')\n';
                                msgToSend += '\n';
                                msgToSend += '*Odds are from FanDuel';
                            }
                        });
                    }
                });
            }

            //spread
            if (markets === 'spreads') {
                results.forEach((result) => {
                    var homeTeam = result.home_team.toLowerCase();
                    var homePrice;
                    var homeLine;
                    var awayTeam = result.away_team.toLowerCase();
                    var awayPrice;
                    var awayLine;
                    
                    if ((homeTeam.includes(input_team.toLowerCase()) || awayTeam.includes(input_team.toLowerCase())) && !found) {
                        found = true;
                        result.bookmakers.forEach((book) => {
                            if (book.key === 'fanduel') {
                                if (book.markets[0].outcomes[0].name === result.home_team) {
                                    homePrice = book.markets[0].outcomes[0].price;
                                    homePrice = (/^\d/.test(homePrice)) ? '+' + homePrice : homePrice;
                                    homeLine = book.markets[0].outcomes[0].point;
                                    homeLine = (/^\d/.test(homeLine)) ? '+' + homeLine : homeLine;
                                } else {
                                    awayPrice = book.markets[0].outcomes[0].price;
                                    awayPrice = (/^\d/.test(awayPrice)) ? '+' + awayPrice : awayPrice;
                                    awayLine = book.markets[0].outcomes[0].point;
                                    awayLine = (/^\d/.test(awayLine)) ? '+' + awayLine : awayLine;
                                }
                
                                if (book.markets[0].outcomes[1].name === result.home_team) {
                                    homePrice = book.markets[0].outcomes[1].price;
                                    homePrice = (/^\d/.test(homePrice)) ? '+' + homePrice : homePrice;
                                    homeLine = book.markets[0].outcomes[1].point;
                                    homeLine = (/^\d/.test(homeLine)) ? '+' + homeLine : homeLine;
                                } else {
                                    awayPrice = book.markets[0].outcomes[1].price;
                                    awayPrice = (/^\d/.test(awayPrice)) ? '+' + awayPrice : awayPrice;
                                    awayLine = book.markets[0].outcomes[1].point;
                                    awayLine = (/^\d/.test(awayLine)) ? '+' + awayLine : awayLine;
                                }
                
                                msgToSend += 'Away: ' + result.away_team + '  ' + awayLine + ' (' + awayPrice + ')\n';
                                msgToSend += 'Home: ' + result.home_team + '  ' + homeLine + ' (' + homePrice + ')\n';
                                msgToSend += '\n';
                                msgToSend += '*Odds are from FanDuel';
                            }
                        });
                    }
                });
            }
                
            // Check your usage
            console.log('Remaining requests',response.headers['x-requests-remaining'])
            console.log('Used requests',response.headers['x-requests-used'])
            console.log('Percent Used', finalPct);

            setTimeout(function() {
                bot.postMsg(msgToSend);
            }, 1000);

            if (finalPct > 21) {
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                      user: process.env.GMAIL_USER,
                      pass: process.env.GMAIL_PASS
                    }
                });
                  
                var mailOptions = {
                    from: process.env.GMAIL_USER,
                    to: process.env.GMAIL_USER,
                    subject: 'OddsAPI Request Limit Over 95%',
                    text: 'Your OddsAPI account has almost reached its monthly api call limit. Current usage: ' + finalPct + '%'
                };
                  
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
            }
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
