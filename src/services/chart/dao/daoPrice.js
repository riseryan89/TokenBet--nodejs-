const { zrangebyscoreAsync } = require('../../../dbapi/redisClient');

const getChartDataOld = (marketId, fromTimeStamp) => {
  return new Promise(async(resolve, reject) => {
    try {
      const retRange = await zrangebyscoreAsync('PRICE_'+ marketId, fromTimeStamp, '+inf');
      // console.log(retRange);
      resolve(JSON.parse(`[${retRange}]`));
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

const getChartData = (fsym, tsy, fromTimeStamp, intervalSec) => {
  const key = `PRICE_${fsym}_${tsy}_${intervalSec}s`;
  // console.log(key);
  return new Promise(async(resolve, reject) => {
    try {
      const retRange = await zrangebyscoreAsync(key, fromTimeStamp, '+inf');
      // console.log(retRange);
      // resolve(JSON.parse(`[${retRange}]`));
      const data = JSON.parse(`[${retRange}]`).map(x => {
        const { fsym,tsym,interval,timeStamp,openPrice,closePrice } = x;
        return { fsym,tsym,interval,timeStamp,openPrice,closePrice };
      });
      resolve(data);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};


module.exports = {
  getChartData
};
