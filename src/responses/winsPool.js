const bot = require("../bot");

function trigger(msg) {
  return /wins pool standings/i.test(msg.text);
}

async function respond(msg) {
  try {
    fetchNflWins()
      .then(wins => console.log("NFL Wins:", wins))
      .catch(err => console.error(err));
  } catch (err) {
    console.error(err);
  }
}

async function fetchNflWins() {
  const url = "https://partners.api.espn.com/v2/sports/football/nfl/standings";

  const resp = await fetch(url, { headers: { "Accept": "application/json" }});
  if (!resp.ok) {
    throw new Error(`Failed to fetch standings: ${resp.status}`);
  }

  const data = await resp.json();
  const winsByTeam = {};

  function processEntries(entries) {
    entries.forEach(entry => {
      const team = entry.team;
      const abbr = team.abbreviation;

      // Find overall or total record object
      const rec = entry.records.find(r =>
        r.type === "total" ||
        r.name?.toLowerCase() === "overall"
      );
      if (!rec) return;

      const winStat = rec.stats.find(s =>
        s.type === "wins" ||
        s.abbreviation === "W"
      );
      if (!winStat) return;

      winsByTeam[abbr] = winStat.value;
    });
  }

  if (Array.isArray(data.children)) {
    data.children.forEach(group => {
      const standings = group.standings;
      if (standings?.entries) {
        processEntries(standings.entries);
      }
    });
  }

  return winsByTeam;
}

exports.trigger = trigger;
exports.respond = respond;