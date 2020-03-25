const moment = require('moment');
const { Error540 } = require('../../common/error');
const daoBet = require('./dao/daoBet');
const daoUserWallet = require('./dao/daoUserWallet');
const gameInfo = require('./gameInfoService');
const NodeCache = require('node-cache');
const cacheBettingList = new NodeCache();

function bet(mmbrId, gameId, type, amount) {
  return new Promise(async (resolve, reject) => {
    try {
      // check balance
      const chipBalance = await daoUserWallet.getChipBalance(mmbrId, 'AW');
      // console.log(chipBalance);
      if (chipBalance.available === 0) {
        throw new Error540('ERR540_NOTENOUGH_CHIP');
      }

      let dataGameBasic = gameInfo.getNextGameInfo().find(x => x.gameId === gameId);

      // check freezing time
      const now = moment.now();
      if (dataGameBasic.openTime - now < 5000) {
        reject(new Error('ERR440_FREEZING'));
        return;
      }
      
      const retNewBet = await daoBet.addNewBetting(`BETLIST_${gameId}_${dataGameBasic.openTime}`, mmbrId, type, amount, moment.now());
      console.log({retNewBet});
      
      // update balance
      const retBal = await daoUserWallet.updateChipBalance(mmbrId, 'AW', amount, amount);
      if (retBal.affectedRows === 0) {
        throw new Error540('ERR540_UPDATE_ERROR');
      }
      
      resolve({result: 'OK'});

    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

function cancel(mmbrId, type, amount, time, gameId, openTime) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await daoBet.removeBetting(`BETLIST_${gameId}_${openTime}`, mmbrId, type, amount, time);
      resolve(data);

      // update balance
      const retBal = await daoUserWallet.updateChipBalance(mmbrId, 'AW', - amount, - amount);
      if (retBal.affectedRows === 0) {
        throw new Error540('ERR540_UPDATE_ERROR');
      }
      
      resolve({result: 'OK'});
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

const loadBettingList = async() => {
  const now = moment.now();
  const retList = [];
  for (let game of gameInfo.getGameInfo()) {
    const timeMillis = game.gameTimeSec * 1000;
    const openTime = now - (now % timeMillis);
    const closeTime = openTime + timeMillis;
    const list = await daoBet.getBettingList(`BETLIST_${game.gameId}_${openTime}`);
    retList.push(... list.map(x => {
      x.gameId = game.gameId;
      x.openTime = openTime;
      x.closeTime = closeTime;
      return x;
    }));
    const openTimeNext = openTime + timeMillis;
    const closeTimeNext = openTimeNext + timeMillis;
    const listNext = await daoBet.getBettingList(`BETLIST_${game.gameId}_${openTimeNext}`);
    retList.push(... listNext.map(x => {
      x.gameId = game.gameId;
      x.openTime = openTimeNext;
      x.closeTime = closeTimeNext;
      return x;
    }));
    cacheBettingList.set('BettingList', retList);
  }
};

loadBettingList();
setInterval(loadBettingList, 500);

const getMyOpenBettingList = (mmbrId) => new Promise(async (resolve, reject) => {
  const list = cacheBettingList.get('BettingList');
  // console.log(list);
  if (!list) {
    resolve([]);
    return;
  }
  // console.log('getMyOpenBettingList', list.filter(x => x.mmbrId === mmbrId));
  resolve(list.filter(x => x.mmbrId === mmbrId));
});

function getMyOpenBettingList2(mmbrId) {
  const now = moment.now();
  const list = cacheBettingList.get('BettingList');
  console.log(list);
  return new Promise(async (resolve, reject) => {
    let retList = [];
    
    try {
      for (let game of gameInfo.getGameInfo()) {
        const timeMillis = game.gameTimeSec * 1000;
        const openTime = now - (now % timeMillis);
        const closeTime = openTime + timeMillis;
        const list = await daoBet.getBettingList(`BETLIST_${game.gameId}_${openTime}`);
        retList.push(... list.filter(x => x.mmbrId === mmbrId).map(x => {
          x.gameId = game.gameId;
          x.openTime = openTime;
          x.closeTime = closeTime;
          return x;
        }));

        const openTimeNext = openTime + timeMillis;
        const closeTimeNext = openTimeNext + timeMillis;
        const listNext = await daoBet.getBettingList(`BETLIST_${game.gameId}_${openTimeNext}`);
        retList.push(... listNext.filter(x => x.mmbrId === mmbrId).map(x => {
          x.gameId = game.gameId;
          x.openTime = openTimeNext;
          x.closeTime = closeTimeNext;
          return x;
        }));
      }

      // console.log('getMyOpenBettingList', retList);
      resolve(retList);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

const getMyRecentResultList = (mmbrId, fromTime) => new Promise(async(resolve, reject) => {
  try {
    const currList = await daoBet.getRecentGameResult(mmbrId, fromTime);
    resolve(currList);
  } catch (error) {
    console.error(error);
    reject(error);
  }
});

const getMyGameResultHistory = (mmbrId, fromTime, toTime) => new Promise(async(resolve, reject) => {
  try {
    const currList = await daoBet.getMyGameResultHistory(mmbrId, fromTime, toTime);
    resolve(currList);
  } catch (error) {
    console.error(error);
    reject(error);
  }
});

module.exports = {
  bet,
  cancel,
  getMyOpenBettingList,
  getMyRecentResultList,
  getMyGameResultHistory,
};
