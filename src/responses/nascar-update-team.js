const config = require("../config");
const bot = require("../bot");
const rp = require("request-promise");
const mysql = require('mysql2/promise');

function trigger(msg) {
    return /@sub/i.test(msg.text);
}

async function respond(msg) {
    const connection = await mysql.createConnection({
        host: config.DATABASE_HOST,
        user: config.DATABASE_USER,
        password: config.DATABASE_PASS,
        database: config.DATABASE_NAME
    });

    try {
        console.log('Full Message', msg);
        let message = '';
        let update = true;
        let teamFound = false;
        let driversValid = false;
        var [driverA, driverB] = [];
        var team = {};
        let input = msg.text.replace(/.*@/i, "").trim();

        //get team name of requestor
        let teamName = getTeamName(msg.sender_id);

        //get current week race details
        const [rows] = await connection.execute(
            'SELECT name, date, number FROM `races_2025` WHERE `closed` = 0 LIMIT 1'
        );
        const { name, date, number } = rows[0];

        //if user specified week in message, get week number and set team week; if not specified, use current week
        const weekNumber = getWeekNumber(input);
        let teamWeek = (weekNumber) ? weekNumber : number;

        // extract driver names from string; if unable, input is incorrect, send message, no udpate; else map to variables
        const driverNames = parseSwitchRequest(input);
        if (!driverNames) {
            console.log("Invalid input format.");
            message = "Invalid input. Please check message and try again";
            update = false;
        } else {
            [driverA, driverB] = driverNames.map(name => name.toLowerCase());
            driversValid = true;
        }

        //get team based on user and week
        const [rows2] = await connection.execute(
            'SELECT driver1, driver2, driver3, driver4 FROM teams_2025 WHERE team_name = ? AND week = ?',
            [teamName, teamWeek]
        );

        // if team not found, send message and no update; if found, set to variable
        if (rows2.length === 0) {
            console.log('Team not found.');
            message = 'Team not matched in the database';
            update = false;
        } else {
            team = rows2[0];
            teamFound = true;
        }

        if (driversValid && teamFound) {
            //get the column names for the current column each driver is in
            let columnA = null, columnB = null;
            for (const [column, value] of Object.entries(team)) {
                if (value && value.toLowerCase() === driverA) columnA = column;
                if (value && value.toLowerCase() === driverB) columnB = column;
            }

            // if either driver is not found on the current team, send not found message and no update
            if (!columnA || !columnB) {
                console.log('One or both drivers not found on this team');
                message = 'One or both drivers not found on your team';
                update = false;
            }
        }

        //if all checks pass, update
        if (update) {
            const sql = `UPDATE teams_2025 SET ${columnA} = ?, ${columnB} = ? WHERE team_name = ? AND week = ?`;
            await connection.execute(sql, [team[`${columnB}`], team[`${columnA}`], teamName, teamWeek]);

            console.log(`✅ Switched "${driverA}" and "${driverB}" successfully.`);
            message = '✅  Substitution made successfully.';
        }

        bot.postMsg(message);
    } catch (err) {
        console.error('Database error:', err);
        return { success: false, message: 'Database error' };
    } finally {
        await connection.end();
    }
}

function parseSwitchRequest(input) {
  const lower = input.toLowerCase().trim();
  const match = lower.match(/(?:sub|switch)\s+([\w\s]+?)\s+(?:for|with|and)\s+([\w\s]+)/i);

  if (!match) return null;

  const nameA = match[1].trim();
  const nameB = match[2].trim();

  return [nameA, nameB];
}

function getTeamName(userId) {
    const userTeamMap = {
        "25143759": "Team Nick",
        /*"": "Team Rachel",
        "": "Team Matt",
        "": "Team Jim",
        "": "Team Jru",
        "": "Team Chives",
        "": "Team Donna",
        "": "Team Mike",
        "": "Team Steve",
        "": "Team Joey"*/
    };

    return userTeamMap[userId] || null;
}

function getWeekNumber(str) {
  const match = str.match(/\bweek\s+(\d+)\b/i);
  return match ? parseInt(match[1], 10) : null;
}


exports.trigger = trigger;
exports.respond = respond;
