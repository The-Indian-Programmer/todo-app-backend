const { createLogger, transports } = require('winston');
const moment = require('moment');
const path = require('path');

const errorLogsPath = process.env.ERROR_LOGS_PATH || 'logs';


const fileName = 'error_log' + "_" + moment().format('YYYY_MM_DD') + '.log';

const getDynamicFilename = () => {
    return path.join(__dirname, `../${errorLogsPath}`, fileName);
}
const logger = createLogger({
  transports: [
    new transports.File({ filename: getDynamicFilename() })
  ]
});


module.exports = { logger };
