'use strict';
const logError = require('../logger').get('error');
module.exports = class Error540 {
    constructor(code, message = '') {
        this.status = 540;
        this.code = code;
        this.message = message;
        this.time = new Date().toISOString();
        logError.error(`${this.time}${this.status}::${this.code}::${this.message}`);
        // console.error(`${this.time}${this.status}::${this.code}::${this.message}`);
    }
};