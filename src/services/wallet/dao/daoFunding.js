const mysql = require('mysql');
const mysqlCon = require("../../../dbapi/mysqlPromise");
const { Error540 } = require('../../../common/error');

const getFundingHistory = (mmbrId) => new Promise(async(resolve, reject) => {
  try {
    var connection = await mysqlCon.getConnectionPromiseRead();
    const query = mysql.format(sqlGetFundingHistory, [mmbrId, mmbrId]);
    // console.log(query);
    const ret = await mysqlCon.queryPromise(connection, query);
    // console.log(ret);
    resolve(ret.map(x => {
      return {
        code: x.coin_code,
        time: Number(x.time),
        type: x.type,
        addr: x.addr,
        amount: x.amount,
        status: x.status
      };
    }));
  } catch (error) {
    console.error(error);
    reject(new Error540('ERR540_', 'getFundingHistory'));
  }
  mysqlCon.connectionRelease(connection);
});

const getWithdrawalResultsIn24H = (mmbrId, coinCode) => new Promise(async(resolve, reject) => {
  const time24H = new Date(new Date().getTime() - 24 * 3600 * 1000);
  try {
    var connection = await mysqlCon.getConnectionPromiseRead();
    const query = mysql.format(sqlGetWithdrawalResultsIn24H, [mmbrId, coinCode, time24H.toISOString()]);
    const ret = await mysqlCon.queryPromise(connection, query);
    // console.log(ret);
    resolve(ret.map(x => {
      return {
        code: x.coin_code,
        amount: x.withdraw_apply_amount,
        applyDate: x.application_dttm
      };
    }));
  } catch (error) {
    console.error(error);
    reject(new Error540('ERR540_', 'getWithdrawalResultsIn24H'));
  }
  mysqlCon.connectionRelease(connection);
});

const withdrawal = (mmbrId, coinCode, address, oldBalance, amount, fee) => {
  const dtApply = new Date().toISOString();
  // console.log({exClass, mmbrId, awAmount, coinCode, coinAmount, exchangeRate, autoExchange});
  return new Promise(async(resolve, reject) => {
    try {
      var connection = await mysqlCon.getConnectionPromiseWrite();
      await mysqlCon.beginTransactionPromise(connection);

      const queryUpLedger = mysql.format(sqlUpdateLedgerForWithdrawal, [amount, amount, mmbrId, coinCode]);
      const resUpLedge = await mysqlCon.queryPromise(connection, queryUpLedger);
      if (resUpLedge.affectedRows == 0) {
        throw new Error540('ERR540_UPLEDGE');
      }

      const queryInsDtl = mysql.format(sqlInsertWithdrawalDetail, [mmbrId, dtApply, coinCode, address, amount, oldBalance, fee]);
      const resInsDtl = await mysqlCon.queryPromise(connection, queryInsDtl);
      if (resInsDtl.affectedRows == 0) {
        throw new Error540('ERR540_INSERT_2');
      }

      mysqlCon.commitPromise(connection);

      resolve({mmbrId, dtApply, coinCode, address, amount, oldBalance, fee});
    } catch (error) {
      mysqlCon.connectionRollbackRelease(connection);
      console.error(error);
      reject(error);
    }
    mysqlCon.connectionRelease(connection);
  });
};

const sqlGetFundingHistory = `
SELECT coin_code, deposit_dttm as time, 'in' as type, deposit_addr as addr, deposit_quantity as amount, '' as status
FROM fn_deposit_detail
where mmbr_id = ?
union
SELECT coin_code, application_dttm as time, 'out' as type, withdraw_addr as addr, withdraw_apply_amount as amount, withdraw_state_code as status
FROM fn_withdraw_detail
where mmbr_id = ?
order by time desc
`;

const sqlGetWithdrawalResultsIn24H = `
SELECT application_dttm, coin_code, withdraw_apply_amount
FROM fn_withdraw_detail
where mmbr_id = ? and coin_code = ? and application_dttm > ?
`;

const sqlUpdateLedgerForWithdrawal = `
UPDATE fn_mmbr_ledger
SET possession_quantity=possession_quantity-?, withdraw_acmlt_quantity=withdraw_acmlt_quantity+?, sys_process_dttm=CURRENT_TIMESTAMP(6)
WHERE mmbr_id=? AND coin_code=?
`;

const sqlInsertWithdrawalDetail = `
INSERT INTO fn_withdraw_detail
(mmbr_id, application_dttm, coin_code, withdraw_addr, withdraw_apply_amount, possession_amount, withdraw_fee, withdraw_state_code, sys_process_dttm)
VALUES(?, ?, ?, ?, ?, ?, ?, '0', CURRENT_TIMESTAMP(6))
`;

module.exports = {
  getFundingHistory,
  getWithdrawalResultsIn24H,
  withdrawal
};
