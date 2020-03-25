const mysql = require('mysql');
const mysqlCon = require("../../../dbapi/mysqlPromise");
const Error540 = require('../../../common/error/Error540');

function getMemberChipAmount(mmbrId, chipCode) {
  return new Promise(async(resolve, reject) => {
    try {
      var connection = await mysqlCon.getConnectionPromiseRead();
      const query = mysql.format(sqlGetChipAmount, [mmbrId, chipCode] );
      const result = await mysqlCon.queryPromise(connection, query);
      // console.log(result);
      resolve(result.map(x => ({
        chipCode: x.chip_code,
        qtyTotal: x.possession_quantity,
        qtyPending: x.result_pending_quantity,
        qtyAvaliable: x.available_quantity
      })));
    } catch (error) {
      console.error(error);
      reject(new Error540('ERR540_getAsset_01', 'getAsset'));
    }
    mysqlCon.connectionRelease(connection);
  });
}

function addNewChip(mmbrId, chipCode) {
  return new Promise(async(resolve, reject) => {
    try {
      var connection = await mysqlCon.getConnectionPromiseWrite();
      const queryInsert = mysql.format(sqlInserNewAsset, [mmbrId, chipCode] );
      const result = await mysqlCon.queryPromise(connection, queryInsert);
      // console.log(result);
      if (result.affectedRows === 0) {
        throw new Error540('ERR540_CHIP_ADD', '');
      }

      await mysqlCon.commitPromise(connection);

      resolve(result);
    } catch (error) {
      console.error(error);
      reject(new Error540('ERR540_getAsset_01', 'getAsset'));
    }
    mysqlCon.connectionRelease(connection);
  });
}

const sqlGetChipAmount = `
SELECT
  chip_code,
  possession_quantity,
  result_pending_quantity,
  possession_quantity - result_pending_quantity as available_quantity
FROM gm_mmbr_assets
WHERE mmbr_id = ?
  AND chip_code = ?
`;

const sqlInserNewAsset = `
INSERT INTO gm_mmbr_assets
(mmbr_id, chip_code, possession_quantity, deposit_acmlt_quantity, withdraw_acmlt_quantity, game_acmlt_quantity, acquire_acmlt_quantity, loss_acmlt_quantity, result_pending_quantity, sys_process_dttm)
VALUES(?, ?, 0.00, 0, 0, 0, 0.00, 0, 0, CURRENT_TIMESTAMP(6))
`;

module.exports.getMemberChipAmount = getMemberChipAmount;
module.exports.addNewChip = addNewChip;
