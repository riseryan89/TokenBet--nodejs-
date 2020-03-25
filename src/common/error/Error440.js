'use strict';
const logError = require('../logger').get('error');
module.exports = class Error440 {
    constructor(code, message = '') {
        this.status = 440;
        this.code = code;
        this.message = message;
        this.time = new Date().toISOString();
        // logError.error(`${this.time}${this.status}::${this.code}::${this.message}`);
        console.error(`${this.time}${this.status}::${this.code}::${this.message}`);
    }
};