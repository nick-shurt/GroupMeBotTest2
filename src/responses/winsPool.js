const bot = require("../bot");

function trigger(msg) {
  return /standings/i.test(msg.text);
}

async function respond(msg) {
  try {
    const pool = {
      pool: [
        {
          nick: {
            teams: { team1: "BUF", team2: "PIT", team3: "IND" },
            wins: 0
          }
        },
        {
          matt: {
            teams: { team1: "SF", team2: "MIN", team3: "ATL" },
            wins: 0
          }
        },
        {
          dockman: {
            teams: { team1: "TB", team2: "DAL", team3: "JAX" },
            wins: 0
          }
        },
        {
          donna: {
            teams: { team1: "DET", team2: "SEA", team3: "LV" },
            wins: 0
          }
        },
        {
          jim: {
            teams: { team1: "WSH", team2: "DEN", team3: "CHI" },
            wins: 0
          }
        },
        {
          joey: {
            teams: { team1: "BAL", team2: "NE", team3: "CAR" },
            wins: 0
          }
        },
        {
          john: {
            teams: { team1: "GB", team2: "CIN", team3: "NYJ" },
            wins: 0
          }
        },
        {
          mike: {
            teams: { team1: "PHI", team2: "LAC", team3: "TEN" },
            wins: 0
          }
        },
        {
          pat: {
            teams: { team1: "LAR", team2: "ARI", team3: "MIA" },
            wins: 0
          }
        },
        {
          ricky: {
            teams: { team1: "KC", team2: "HOU", team3: "NYG" },
            wins: 0
          }
        }
      ]
    };
    fetchNflWins()
      .then((winsByTeam) => {
        console.log("NFL Wins:", winsByTeam);
        const updatedPoolData = updatePoolWins(pool, winsByTeam);
        console.log(JSON.stringify(updatedPoolData, null, 2));

        setTimeout(function() {
          bot.postMsg(formatWinsTable(updatedPoolData));
        }, 1000);
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

    Object.values(teams).forEach(teamName => {
      if (winsByTeam[teamName] !== undefined) {
        totalWins += winsByTeam[teamName];
      }
    });

    playerData.wins = totalWins;
  });

  return poolData;
}

function formatWinsTable(poolData) {
  const players = poolData.pool.map(entry => {
    const rawName = Object.keys(entry)[0];
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
    const wins = entry[rawName].wins;
    return { name, wins };
  });

  players.sort((a, b) => b.wins - a.wins);

  const longestName = Math.max(...players.map(p => p.name.length));
  const nameColWidth = longestName + 2; // padding

  let output = "Standings\n";
  output += "-------------------------------\n";

  players.forEach(p => {
    const paddedName = p.name.padEnd(nameColWidth, " ");
    output += `${paddedName}${p.wins}\n`;
  });

  return output;
}

exports.trigger = trigger;
exports.respond = respond;