const redis = require('redis');
const { promisify } = require('util');
const dbInfo = require('/var/aw_system/web_conf/webapp/dbAccess');

let redisClient = null;

const getClient = () => {
  if (redisClient === null) {
    redisClient = redis.createClient(dbInfo.redis.port, dbInfo.redis.host);
  }
  return redisClient;
};

const saddAsync = promisify(getClient().sadd).bind(redisClient);
const sremAsync = promisify(getClient().srem).bind(redisClient);
const smembersAsync = promisify(getClient().smembers).bind(redisClient);
const zrangebyscoreAsync = promisify(getClient().zrangebyscore).bind(redisClient);

module.exports = {
  getClient,
  saddAsync,
  sremAsync,
  smembersAsync,
  zrangebyscoreAsync,
};
