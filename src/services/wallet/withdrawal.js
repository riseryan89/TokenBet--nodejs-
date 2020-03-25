const bcrypt = require('bcryptjs');
const { Error440, Error540 } = require('../../common/error');
const daoCoin = require('./dao/daoCoin');
const daoFunding = require('./dao/daoFunding');
const daoMmbr = require('./dao/daoMmbr');

const getCoinInfo = () => new Promise(async(resolve, reject) => {
  try {
    const coinInfo = await daoCoin.getCoinInfo();
    resolve(coinInfo);
  } catch (error) {
    console.error(error);
    reject(error);
  }
});

// return { total amount, 24H limit }
const getAvailable = (mmbrId, coinCode) => new Promise(async(resolve, reject) => {
  try {
    const coinInfos = await daoCoin.getCoinInfo();
    const coinInfo = coinInfos.find(x => x.code === coinCode);
    if (!coinInfo) {
      throw new Error440('ERR440_COIN_INVALID');
    }
    const limit24H = coinInfo.withdrawDailyLimit;

    const coinList = await daoCoin.getMemberCoinAmount(mmbrId);

    let totalAmount = 0;
    const myCoin = coinList.find(x => x.code === coinCode);
    if (myCoin) {
      totalAmount = myCoin.amount;
    }

    let useAmountIn24H = 0;
    const withdrawalResult24H = await daoFunding.getWithdrawalResultsIn24H(mmbrId, coinCode);
    if (withdrawalResult24H.length > 0) {
      useAmountIn24H = withdrawalResult24H.reduce((acc, x) => acc + x.amount, 0);
    }
    let available = (totalAmount < limit24H ? totalAmount : limit24H) - useAmountIn24H;
    if (available < 0) {available = 0;}

    resolve({
      totalAmount,
      limit24H,
      useAmountIn24H,
      available: (totalAmount < limit24H ? totalAmount : limit24H) - useAmountIn24H
    });
  } catch (error) {
    console.error(error);
    reject(error);
  }
});

const withdrawal = (mmbrId, coinCode, amount, address, password, veriCode) => new Promise(async(resolve, reject) => {
  console.log({mmbrId, coinCode, amount, address, password, veriCode});
  try {
    // address valid
    if (!isValidAddress(coinCode, address)) {
      throw new Error440('ERR440_ADDR_INVALID');
    }

    const coinInfos = await daoCoin.getCoinInfo();
    const coinInfo = coinInfos.find(x => x.code === coinCode);
    if (!coinInfo) {
      throw new Error440('ERR440_COIN_INVALID');
    }

    // check min amount rule
    if (amount < coinInfo.withdrawMinAmount) {
      throw new Error440('ERR440_RULE_OUT');
    }

    // check balance
    const balance = await getAvailable(mmbrId, coinCode);
    if (balance.available < amount) {
      throw new Error440('ERR440_BALANCE_NOTENOUGH');
    }
    console.log(balance);

    const pwInDb = await daoMmbr.getMmbrPassword(mmbrId);
    // password, otp code
    const comparedPw = bcrypt.compareSync(password, pwInDb.password);
    if(!comparedPw) {
      throw new Error440('ERR440_NOT_MATCH_PASSWORD', 'not match password');
    }

    console.log('success');
    daoFunding.withdrawal(mmbrId, coinCode, address, balance.totalAmount, amount, coinInfo.withdrawFee);

    resolve('success');

  } catch (error) {
    console.error(error);
    reject(error);    
  }
});

const isValidAddress = (coinCode, address) => {
  if (coinCode === 'BTC') {
    if (address.length === 34 && (address.startsWith('1') || address.startsWith('3'))) {
      return true;
    } else {
      return false;
    }
  }

  if (coinCode === 'ETH') {
    if (address.length === 42 && address.startsWith('0x')) {
      return true;
    } else {
      return false;
    }
  }

  return false;
};

module.exports = {
  getCoinInfo,
  getAvailable,
  withdrawal
};
