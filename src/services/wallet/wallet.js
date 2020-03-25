const { Error440 } = require('../../common/error');
const daoChip = require('./dao/daoChip');
const daoCoin = require('./dao/daoCoin');
const daoFunding = require('./dao/daoFunding');

function getMemberAssets(mmbrId) {
  return new Promise(async(resolve, reject) => {
    try {
      const dataChip = await getMemberChipAmount(mmbrId);
      const dataCoin = await getMemberCoinAmount(mmbrId);
      resolve({chip: dataChip, coins: dataCoin });
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

function getMemberChipAmount(mmbrId) {
  const chipCode = 'AW';
  return new Promise(async(resolve, reject) => {
    try {
      let data = await daoChip.getMemberChipAmount(mmbrId, chipCode);
      if (data.length === 0) {
        await daoChip.addNewChip(mmbrId, chipCode);
        data = await daoChip.getMemberChipAmount(mmbrId, chipCode);
      }
      resolve({
        code: data[0].chipCode,
        amount: data[0].qtyAvaliable
      });
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

function getMemberCoinAmount(mmbrId) {
  return new Promise(async(resolve, reject) => {
    try {
      let data = await daoCoin.getMemberCoinAmount(mmbrId);
      resolve(data);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

const getFundingHistory = (mmbrId) => new Promise(async(resolve, reject) => {
  try {
    let data = await daoFunding.getFundingHistory(mmbrId);
    resolve(data);
  } catch (error) {
    console.error(error);
    reject(error);
  }
});

module.exports = {
  getMemberAssets,
  getMemberChipAmount,
  getMemberCoinAmount,
  getFundingHistory,
};
