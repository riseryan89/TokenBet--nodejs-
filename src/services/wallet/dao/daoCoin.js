const mysql = require('mysql');
const mysqlCon = require("../../../dbapi/mysqlPromise");
const Error540 = require('../../../common/error/Error540');

const getCoinInfo = () => new Promise(async(resolve, reject) => {
  let connection;
  try {
    connection = await mysqlCon.getConnectionPromiseRead();
    const query = mysql.format(sqlGetCoinInfo);
    const res = await mysqlCon.queryPromise(connection, query);
    // console.log(res);
    resolve(res.map(x => {
      return {
        code: x.coin_code,
        name: x.coin_name,
        order: x.regist_order,
        withdrawMinAmount: x.min_withdraw_amount,
        withdrawDailyLimit: x.daily_withdraw_limit,
        withdrawFee: x.withdraw_fee,
        depositMinAmount: x.min_deposit_amount,
        minUnit: x.minimum_unit
      };
    }));
  } catch (error) {
    console.error(error);
    reject(new Error540('ERR540_getAsset_01', 'getAsset'));
  }
  mysqlCon.connectionRelease(connection);
});

function getMemberCoinAmount(mmbrId) {
  return new Promise(async(resolve, reject) => {
    try {
      var connection = await mysqlCon.getConnectionPromiseRead();
      const query = mysql.format(sqlGetCoinAmount, [mmbrId] );
      const result = await mysqlCon.queryPromise(connection, query);
      // console.log(result);
      // resolve(result);
      resolve(result.map(x => {
        return {
          code: x.coin_code,
          amount: x.possession_quantity
        };
      }));
    } catch (error) {
      console.error(error);
      reject(new Error540('ERR540_getAsset_01', 'getAsset'));
    }
    mysqlCon.connectionRelease(connection);
  });
}

const sqlGetCoinInfo = `
SELECT coin_code, coin_name, registration_date, regist_order, min_withdraw_amount, daily_withdraw_limit, withdraw_fee, min_deposit_amount, minimum_unit
FROM cm_coin_info
`;

const sqlGetCoinAmount = `
SELECT mmbr_id, coin_code, possession_quantity, deposit_acmlt_quantity, withdraw_acmlt_quantity, exchange_income_quantity, exchange_spend_quantity
FROM fn_mmbr_ledger
WHERE mmbr_id = ?
`;

module.exports = {
  getCoinInfo,
  getMemberCoinAmount
};
