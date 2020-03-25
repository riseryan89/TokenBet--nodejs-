const mysql = require('mysql');
const mysqlCon = require("../../../dbapi/mysqlPromise");
const Error540 = require('../../../common/error/Error540');

const exClassBuy = 'B';
const exClassSell = 'S';

function getExchangeRatio() {
  return new Promise(async(resolve, reject) => {
    try {
      var connection = await mysqlCon.getConnectionPromiseRead();
      const query = mysql.format(sqlGetExchangeRatio);
      const result = await mysqlCon.queryPromise(connection, query);
      // console.log(result);
      resolve(result);
    } catch (error) {
      console.error(error);
      reject(new Error540('ERR540_getAsset_01', 'getAsset'));
    }
    mysqlCon.connectionRelease(connection);
  });
}

function awExchange(exClass, mmbrId, awAmount, coinCode, coinAmount, exchangeRate, autoExchange = 'N') {
  // console.log({exClass, mmbrId, awAmount, coinCode, coinAmount, exchangeRate, autoExchange});
  return new Promise(async(resolve, reject) => {
    try {
      var connection = await mysqlCon.getConnectionPromiseWrite();
      await mysqlCon.beginTransactionPromise(connection);

      const queryInsertExchangeDetail = mysql.format(sqlInsertExchangeDetail, [mmbrId, coinCode, exClass, coinAmount, exchangeRate, awAmount, autoExchange]);
      const resultInsertExchangeDetail = await mysqlCon.queryPromise(connection, queryInsertExchangeDetail);
      if (resultInsertExchangeDetail.affectedRows == 0) {
        throw new Error540('ERR540_INSERT_1');
      }

      const queryUpdateMmbrCoinLedger = mysql.format(sqlUpdateMmbrCoinLedger, [
        (exClass === exClassBuy) ? 0 - coinAmount : coinAmount, 
        (exClass === exClassBuy) ? 0 : coinAmount, 
        (exClass === exClassBuy) ? coinAmount : 0, 
        mmbrId, coinCode]);
      const resultUpdateMmbrCoinLedger = await mysqlCon.queryPromise(connection, queryUpdateMmbrCoinLedger);
      if (resultUpdateMmbrCoinLedger.affectedRows == 0) {
        if (exClass === exClassBuy) {
          throw new Error540('ERR540_INSERT_3');
        }
        const queryInsertMmbrCoinLedger = mysql.format(sqlInsertMmbrCoinLedger, [mmbrId, coinCode, coinAmount, 0, 0, coinAmount, 0]);
        const resultInsertMmbrCoinLedgerr = await mysqlCon.queryPromise(connection, queryInsertMmbrCoinLedger);
        if (resultInsertMmbrCoinLedgerr.affectedRows == 0) {
          throw new Error540('ERR540_INSERT_2');
        }
      }

      const queryUpdateMmbrChipAsset = mysql.format(sqlUpdateMmbrChipAsset, [
        (exClass === exClassBuy) ? awAmount : 0 - awAmount, 
        (exClass === exClassBuy) ? awAmount : 0, 
        (exClass === exClassBuy) ? 0 : awAmount, 
        mmbrId, 'AW']);
        // console.log(queryUpdateMmbrChipAsset);
      const resultUpdateMmbrChipAsset = await mysqlCon.queryPromise(connection, queryUpdateMmbrChipAsset);
      // console.log(resultUpdateMmbrChipAsset);
      if (resultUpdateMmbrChipAsset.affectedRows == 0) {
        if (exClass === exClassSell) {
          throw new Error540('ERR540_INSERT_4');
        }
        const queryInserMmbrChipAsset = mysql.format(sqlInserMmbrChipAsset, [mmbrId, 'AW', awAmount, awAmount]);
        const resultInserMmbrChipAsset = await mysqlCon.queryPromise(connection, queryInserMmbrChipAsset);
        if (resultInserMmbrChipAsset.affectedRows == 0) {
          throw new Error540('ERR540_INSERT_2');
        }
      }

      mysqlCon.commitPromise(connection);

      resolve({exClass, mmbrId, awAmount, coinCode, coinAmount, exchangeRate, autoExchange});
    } catch (error) {
      console.error(error);
      reject(error);
    }
    mysqlCon.connectionRelease(connection);
  });
}

const sqlGetExchangeRatio = `
select M.coin_code as coin_code, exchange_rate, effective_dttm from
(select coin_code, max(effective_dttm) as max_dttm
   FROM fn_coin_exchange_rate
  where effective_dttm <= date_format(now(), '%Y-%m-%d %H:%i:00')
  group by coin_code) as M
inner join
(SELECT coin_code, effective_dttm, exchange_rate from fn_coin_exchange_rate) as N
on M.coin_code = N.coin_code
 and M.max_dttm = N.effective_dttm
union all
(select base_coin_code as coin_code, base_exchange_rate as exchange_rate, effective_dttm from fn_base_exchange_rate where effective_dttm <= date_format(now(), '%Y-%m-%d %H:%i:00') order by effective_dttm desc limit 1)
`;

const sqlInsertExchangeDetail = `
INSERT INTO fn_exchange_detail
(mmbr_id, exchange_dttm, coin_code, exchange_classification, exchange_quantity, exchange_rate, exchange_target_quantity, auto_exchange_yn, sys_process_dttm)
VALUES(?, CURRENT_TIMESTAMP(6), ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(6))
`;

const sqlUpdateMmbrCoinLedger = `
UPDATE fn_mmbr_ledger
SET possession_quantity=possession_quantity+?, exchange_income_quantity=exchange_income_quantity+?, exchange_spend_quantity=exchange_spend_quantity+?, sys_process_dttm=CURRENT_TIMESTAMP(6)
WHERE mmbr_id=? AND coin_code=?
`;

const sqlInsertMmbrCoinLedger = `
INSERT INTO fn_mmbr_ledger
(mmbr_id, coin_code, possession_quantity, deposit_acmlt_quantity, withdraw_acmlt_quantity, exchange_income_quantity, exchange_spend_quantity, sys_process_dttm)
VALUES(?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(6))
`;

const sqlUpdateMmbrChipAsset = `
UPDATE gm_mmbr_assets
SET possession_quantity=possession_quantity+?, deposit_acmlt_quantity=deposit_acmlt_quantity+?, withdraw_acmlt_quantity=withdraw_acmlt_quantity+?, game_acmlt_quantity=0, acquire_acmlt_quantity=0.00, loss_acmlt_quantity=0, result_pending_quantity=0, sys_process_dttm=CURRENT_TIMESTAMP(6)
WHERE mmbr_id=? AND chip_code=?
`;

const sqlInserMmbrChipAsset = `
INSERT INTO gm_mmbr_assets
(mmbr_id, chip_code, possession_quantity, deposit_acmlt_quantity, withdraw_acmlt_quantity, game_acmlt_quantity, acquire_acmlt_quantity, loss_acmlt_quantity, result_pending_quantity, sys_process_dttm)
VALUES(?, ?, ?, ?, 0, 0, 0.00, 0, 0, CURRENT_TIMESTAMP(6))
`;

module.exports.getExchangeRatio = getExchangeRatio;
module.exports.awExchange = awExchange;
