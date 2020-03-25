'use strict';
// const winston = require('winston');
const { createLogger, format, transports, loggers } = require('winston');
const { combine, timestamp, label, printf, prettyPrint } = format;
require('winston-daily-rotate-file');

const logConfs = require('/var/aw_system/web_conf/webapp/logWinston.json');

for (let logConf of logConfs) {
    loggers.add(logConf.category, {
        format: combine(
            timestamp(),
            format.json()
        ),
        transports: [
            new transports.DailyRotateFile(logConf.DailyRotateFile),
            new transports.Console({
                format: format.json()
            })
        ]
    });
}
// loggers.add('general', {
//     format: combine(
//         timestamp(),
//         format.json()
//     ),
//     transports: [
//         new transports.DailyRotateFile({
//             dirname: './log',
//             filename: 'general-%DATE%.log',
//             datePattern: 'YYYY-MM-DD-HH',
//             zippedArchive: true,
//             maxSize: '20m',
//             maxFiles: '14d'
//         }),
//         new transports.Console({
//             format: format.simple()
//         })
//     ]
// });

module.exports = loggers;