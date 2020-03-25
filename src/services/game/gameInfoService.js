const moment = require('moment');
const daoGame = require('./dao/daoGame');
const daoBet = require('./dao/daoBet');
const NodeCache = require('node-cache');
const cacheStatus = new NodeCache();

let gameInfoCache = [];
initGameInfo(); // initialize

function initGameInfo() {
  return new Promise(async(resolve, reject) => {
    try {
      const dataGameBasic = await daoGame.getGameBasicInfoList();
      gameInfoCache = dataGameBasic.map(x => {
        return {
          gameId: x.game_id,
          coinCode: x.coin_code,
          base: x.base_coin_code,
          gameTime: x.game_time,
          gameTimeSec: x.game_time_sec
        };
      });
      console.log(gameInfoCache);
      resolve(gameInfoCache);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

const getNextGameInfo = () => {
  const now = moment.now();
  return gameInfoCache.map(x => {
    const timeMillis = x.gameTimeSec * 1000;
    const openTime = now - (now % timeMillis) + timeMillis;
    const closeTime = openTime + timeMillis;
    return Object.assign({}, x, { openTime, closeTime });
  });
};

const loadNextGamesStatus = async() => {
  let retList = [];
  for (let dataGameBasic of getNextGameInfo()) {        
    const list = await daoBet.getBettingList(`BETLIST_${dataGameBasic.gameId}_${dataGameBasic.openTime}`);
    
    dataGameBasic.amount = {};
    dataGameBasic.amount.total = list.reduce((total, el) => total + el.amount, 0);
    dataGameBasic.amount.call = list.filter(x => x.type === 'call').reduce((total, el) => total + el.amount, 0);
    dataGameBasic.amount.put = list.filter(x => x.type === 'put').reduce((total, el) => total + el.amount, 0);
    dataGameBasic.amount.neutral = list.filter(x => x.type === 'neutral').reduce((total, el) => total + el.amount, 0);
    dataGameBasic.payout = {};
    dataGameBasic.payout.call = parseInt(dataGameBasic.amount.total * 100 / dataGameBasic.amount.call, 0);
    dataGameBasic.payout.put = parseInt(dataGameBasic.amount.total * 100 / dataGameBasic.amount.put, 0);
    dataGameBasic.payout.neutral = parseInt(dataGameBasic.amount.total * 100 / dataGameBasic.amount.neutral, 0);
    retList.push(dataGameBasic);
  }
  cacheStatus.set('nextGamesStatus', retList);
};

loadNextGamesStatus();
setInterval(loadNextGamesStatus, 500);

function getNextGamesStatus() {
  return new Promise(async(resolve, reject) => {
    try {
      // let retList = [];
      // for (let dataGameBasic of getNextGameInfo()) {        
      //   const list = await daoBet.getBettingList(`BETLIST_${dataGameBasic.gameId}_${dataGameBasic.openTime}`);
        
      //   dataGameBasic.amount = {};
      //   dataGameBasic.amount.total = list.reduce((total, el) => total + el.amount, 0);
      //   dataGameBasic.amount.call = list.filter(x => x.type === 'call').reduce((total, el) => total + el.amount, 0);
      //   dataGameBasic.amount.put = list.filter(x => x.type === 'put').reduce((total, el) => total + el.amount, 0);
      //   dataGameBasic.amount.neutral = list.filter(x => x.type === 'neutral').reduce((total, el) => total + el.amount, 0);
      //   dataGameBasic.payout = {};
      //   dataGameBasic.payout.call = parseInt(dataGameBasic.amount.total * 100 / dataGameBasic.amount.call, 0);
      //   dataGameBasic.payout.put = parseInt(dataGameBasic.amount.total * 100 / dataGameBasic.amount.put, 0);
      //   dataGameBasic.payout.neutral = parseInt(dataGameBasic.amount.total * 100 / dataGameBasic.amount.neutral, 0);
      //   retList.push(dataGameBasic);
      // }
      // // console.log(retList);
      // resolve(retList);
      resolve(cacheStatus.get('nextGamesStatus'));
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

const getGameCancelCodes = () => new Promise(async(resolve, reject) => {
  try {
    const codes = daoGame.getGameCancelCodes();
    resolve(codes);
  } catch (error) {
    console.error(error);
    reject(error);
  }
});


module.exports = {
  getGameInfo: () => (gameInfoCache),
  getNextGameInfo,
  getNextGamesStatus,
  getGameCancelCodes,
};
