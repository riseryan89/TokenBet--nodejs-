'use strict';

const mysql = require('mysql');
const dbInfo = require('/var/aw_system/web_conf/webapp/dbAccess');

var poolWrite = mysql.createPool(dbInfo.aws_write);
var poolRead = mysql.createPool(dbInfo.aws_read);

var getConnection = function (callback) {
  poolWrite.getConnection(function (err, connection) {
    callback(err, connection);
  });
};

var getConnectionTransaction = function (callback) {
  poolWrite.getConnection(function (err, connection) {
    if(err){
      callback(err, connection);
    }else{
      connection.beginTransaction(function(err){
        callback(err, connection);
      });
    } 
  });
};

var endConnection = function (callback) {
  poolWrite.releaseConnection(function (err) {
    callback(err);
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

module.exports.getConnection = getConnection;
module.exports.getConnectionTransaction = getConnectionTransaction;
module.exports.endConnection = endConnection;
module.exports.poolWrite = poolWrite;
module.exports.poolRead = poolRead;
module.exports.connectionRelease = connectionRelease;
module.exports.connectionRollbackRelease = connectionRollbackRelease;