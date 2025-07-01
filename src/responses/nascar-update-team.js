const config = require("../config");
const bot = require("../bot");
const rp = require("request-promise");
const mysql = require('mysql2/promise');

function trigger(msg) {
    return /@nascar_update/i.test(msg.text);
}

async function respond(msg) {
    const connection = await mysql.createConnection({
        host: config.DATABASE_HOST,
        user: config.DATABASE_USER,
        password: config.DATABASE_PASS,
        database: config.DATABASE_NAME
    });

    try {
        let message = '';
        let input = msg.text.replace(/.*@nascar_update/i, "").trim();

        const { teamName, driver3, driver4, week } = parseTeamString(input);
        console.log('Team Name: ' + teamName);
        console.log('driver3: ' + driver3);
        console.log('driver4: ' + driver4);
        console.log('week: ' + week);

        const [result] = await connection.execute(
            "UPDATE `teams_2025` SET `driver3` = ?, `driver4` = ? WHERE `teams_2025`.`team_name` = ? AND `teams_2025`.`week` = ?",
            [driver3, driver4, teamName, week]
        );

        if (result.affectedRows === 0) {
            message = 'No rows updated. Input may be incorrect.';
        }

        console.log('Update successful');
        message = 'Team Updated Successfully.';

        setTimeout(function() {
            bot.postMsg(message);
        }, 1000);
    } catch (err) {
        console.error('Database error:', err);
        return { success: false, message: 'Database error' };
    } finally {
        await connection.end();
    }
}

function parseTeamString(input) {
    const parts = input.split(',').map(p => p.trim());
    const [teamName, driver1, driver2, week] = parts;
    return { teamName, driver1, driver2, week };
}

exports.trigger = trigger;
exports.respond = respond;
