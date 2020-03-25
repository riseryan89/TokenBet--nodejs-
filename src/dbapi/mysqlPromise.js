'use strict';
const mysqlCon = require("./mysqlConnect");
const poolWrite = mysqlCon.poolWrite;
const poolRead = mysqlCon.poolRead;

let flagDBFailoverError = false;

function printConnection() {
    console.log(`poolRead  L:${poolRead.config.connectionLimit} F:${poolRead._freeConnections.length} A:${poolRead._allConnections.length} _acquiringConnections:${poolRead._acquiringConnections.length}`);
    console.log(`poolWrite L:${poolWrite.config.connectionLimit} F:${poolWrite._freeConnections.length} A:${poolWrite._allConnections.length} _acquiringConnections:${poolWrite._acquiringConnections.length}`);
}

function getConnPool() {
    return {
        poolRead: {
            limit: poolRead.config.connectionLimit,
            freeConnection: poolRead._freeConnections.length,
            allConnection: poolRead._allConnections.length,
            acquiringConnections: poolRead._acquiringConnections.length
        },
        poolWrite: {
            limit: poolWrite.config.connectionLimit,
            freeConnection: poolWrite._freeConnections.length,
            allConnection: poolWrite._allConnections.length,
            acquiringConnections: poolWrite._acquiringConnections.length
        }
    };
}

var getConnectionPromiseWrite = function() {
    return new Promise(function(resolve, reject){
        if (flagDBFailoverError) {
            reject('db fail over error');
            return;
        }
        poolWrite.getConnection(function(error, result){
        if(error){
            reject(error);
        }
        else{
            resolve(result);
        }
        });
    });
};

var getConnectionPromiseRead = function() {
    return new Promise(function(resolve, reject){
        poolRead.getConnection(function(error, result){
        if(error){
            reject(error);
        }
        else{
            resolve(result);
        }
        });
    });
};

var queryPromise = function(connection, sql, params) {
    return new Promise(function(resolve, reject){
        connection.query(sql, params, function(error, result){
            if(error){
                reject(error);
                if (flagDBFailoverError == false && error.code == 'ER_OPTION_PREVENTS_STATEMENT') {
                    flagDBFailoverError = true;
                    setInterval(function() {
                        process.exit(1);
                    }, 1000);
                }
            }
            else {
                resolve(result);
            }
        });
    });
};

var beginTransactionPromise = function(connection) {
    return new Promise(function(resolve, reject){
        connection.beginTransaction(function(error){
        if(error){
            reject(error);
        }
        else {
            resolve('');
        }
        });
    });
};

var commitPromise = function(connection) {
    return new Promise(function(resolve, reject){
        connection.commit(function(error){
        if(error){
            reject(error);
        }
        else {
            resolve('');
        }
        });
    });
};

var connectionRelease = function(connection) {
    if(connection != undefined){
        connection.release();
    }
};

var connectionRollbackRelease = function(connection) {
    if(connection != undefined){
        connection.rollback();
        connection.release();
    }
};

module.exports.getConnectionPromiseWrite = getConnectionPromiseWrite;
module.exports.getConnectionPromiseRead = getConnectionPromiseRead;
module.exports.queryPromise = queryPromise;
module.exports.beginTransactionPromise = beginTransactionPromise;
module.exports.commitPromise = commitPromise;
module.exports.printConnection = printConnection;
module.exports.getConnPool = getConnPool;
module.exports.connectionRelease = connectionRelease;
module.exports.connectionRollbackRelease = connectionRollbackRelease;
