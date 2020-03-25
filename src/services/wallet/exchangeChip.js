const Error440 = require('../../common/error/Error440');
const Error540 = require('../../common/error/Error540');
const daoExchange = require('./dao/daoExchange');
const daoChip = require('./dao/daoChip');
const daoCoin = require('./dao/daoCoin');
const Big = require('big-js');

const exClassBuy = 'B';
const exClassSell = 'S';

function getExchangeRatio() {
  return new Promise(async(resolve, reject) => {
    try {
      const data = await daoExchange.getExchangeRatio();
      resolve(data.map(x => {
        return {
          coinCode: x.coin_code,
          exchangeRate: x.exchange_rate
        };
      }));
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

function buyAw(mmbrId, awAmount, coinCode) {
  return new Promise(async(resolve, reject) => {
    try {
      // review exchange rate
      const dataRates = await daoExchange.getExchangeRatio();
      const dataRate = dataRates.filter(x => x.coin_code === coinCode);
      if (dataRate.length == 0) {
        throw new Error540('ERR540_UNKOWN_COIN');
      }
      
      // Check balance : coin
      const dataCoinAmounts = await daoCoin.getMemberCoinAmount(mmbrId);
      // const dataCoinAmount = dataCoinAmounts.filter(x => x.coin_code === coinCode);
      const dataCoinAmount = dataCoinAmounts.filter(x => x.code === coinCode);
      if (dataCoinAmount.length == 0) {
        throw new Error440('ERR440_NO_BALANCE');
      }
      
      const coinAmount = Big(awAmount).div(dataRate[0].exchange_rate).toFixed(8);
      console.log(coinAmount);
      // if (dataCoinAmount[0].possession_quantity < coinAmount) {
      if (dataCoinAmount[0].amount < coinAmount) {
        throw new Error440('ERR440_NOTENOUGH_BALANCE');
      }

      const data = await daoExchange.awExchange(exClassBuy, mmbrId, awAmount, coinCode, coinAmount, dataRate[0].exchange_rate);
      resolve(data);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

function sellAw(mmbrId, awAmount, coinCode) {
  return new Promise(async(resolve, reject) => {
    try {
      // review exchange rate
      const dataRates = await daoExchange.getExchangeRatio();
      const dataRate = dataRates.filter(x => x.coin_code === coinCode);
      if (dataRate.length == 0) {
        throw new Error540('ERR540_UNKOWN_COIN');
      }

      // Check balance : chip
      const dataChipAmount = await daoChip.getMemberChipAmount(mmbrId, 'AW');
      if (dataChipAmount.qtyAvaliable < awAmount) {
        throw new Error440('ERR440_NOTENOUGH_BALANCE');
      }

      const coinAmount = Big(awAmount).div(dataRate[0].exchange_rate).toFixed(8);

      const data = await daoExchange.awExchange(exClassSell, mmbrId, awAmount, coinCode, coinAmount, dataRate[0].exchange_rate);
      resolve(data);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

module.exports.getExchangeRatio = getExchangeRatio;
module.exports.buyAw = buyAw;
module.exports.sellAw = sellAw;
