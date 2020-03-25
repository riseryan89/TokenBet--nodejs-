const moment = require('moment');
const Error440 = require('../../common/error/Error440');
const daoPrice = require('./dao/daoPrice');

function getChartData(gameId, fromTime, intervalSec = 1) {
  return new Promise(async (resolve, reject) => {
    // console.log({gameId, fromTime, function: 'getChartData'});
    const [ fsym, tsym, gameTime ] = gameId.split('_');
    // console.log({ fsym, tsym, gameTime });
    try {
      // const data = daoPrice.getChartData(gameId, fromTime);
      const data = await daoPrice.getChartData(fsym, tsym, fromTime, intervalSec);
      // console.log(data);
      resolve(data);
      // update balance
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

module.exports = {
  getChartData
};
