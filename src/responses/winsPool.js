const bot = require("../bot");

function trigger(msg) {
  return /wins pool standings/i.test(msg.text);
}

async function respond(msg) {
  try {
    const pool = {
      pool: [
        {
          nick: {
            teams: { team1: "bills", team2: "steelers", team3: "colts" },
            wins: 0
          }
        },
        {
          matt: {
            teams: { team1: "49ers", team2: "vikings", team3: "falcons" },
            wins: 0
          }
        },
        {
          dockman: {
            teams: { team1: "buccaneers", team2: "cowboys", team3: "jaguars" },
            wins: 0
          }
        },
        {
          donna: {
            teams: { team1: "lions", team2: "seahawks", team3: "raiders" },
            wins: 0
          }
        },
        {
          jim: {
            teams: { team1: "commanders", team2: "broncos", team3: "bears" },
            wins: 0
          }
        },
        {
          joey: {
            teams: { team1: "ravens", team2: "patriots", team3: "panthers" },
            wins: 0
          }
        },
        {
          john: {
            teams: { team1: "packers", team2: "bengals", team3: "jets" },
            wins: 0
          }
        },
        {
          mike: {
            teams: { team1: "eagles", team2: "chargers", team3: "titans" },
            wins: 0
          }
        },
        {
          pat: {
            teams: { team1: "rams", team2: "cardinals", team3: "dolphins" },
            wins: 0
          }
        },
        {
          ricky: {
            teams: { team1: "chiefs", team2: "texans", team3: "giants" },
            wins: 0
          }
        }
      ]
    };
    fetchNflWins()
      .then((winsByTeam) => {
        console.log("NFL Wins:", winsByTeam);
        const updated = updatePoolWins(pool, winsByTeam);
        console.log(JSON.stringify(updated, null, 2));
      })
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

function updatePoolWins(poolData, winsByTeam) {
  poolData.pool.forEach(entry => {
    const playerName = Object.keys(entry)[0];
    const playerData = entry[playerName];

    const teams = playerData.teams;

    let totalWins = 0;

    // Loop through team1, team2, team3
    Object.values(teams).forEach(teamName => {
      const abbr = teamName.toUpperCase();   // your teams are lowercase strings like "bills"
      if (winsByTeam[abbr] !== undefined) {
        totalWins += winsByTeam[abbr];
      }
    });

    playerData.wins = totalWins;
  });

  return poolData;
}

exports.trigger = trigger;
exports.respond = respond;