const moment = require('moment');

function formatMessage(username, message, sender = 'GM') {
    return {
        sender,
        username,
        message,
        time: moment().format('h:mm a')
    };
}

module.exports = formatMessage;