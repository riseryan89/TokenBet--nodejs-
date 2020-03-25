const mysql = require('mysql');
const mysqlCon = require("../../../dbapi/mysqlPromise");
const Error540 = require('../../../common/error/Error540');

const getChipBalance = (mmbrId, chipCode) => new Promise(async(resolve, reject) => {
  let connection;
  try {
    connection = await mysqlCon.getConnectionPromiseRead();
    const query = mysql.format(sqlGetChipBalance, [mmbrId, chipCode]);
    const ret = await mysqlCon.queryPromise(connection, query);
    // console.log(result);
    if (ret.length === 0) {
      resolve({
        possession: 0,
        pending: 0,
        available: 0
      });
    } else {
      resolve({
        possession: ret[0].possession_quantity,
        pending: ret[0].result_pending_quantity,
        available: ret[0].available
      });
    }
  } catch (error) {
    console.error(error);
    reject(new Error540('ERR540'));
  }
  mysqlCon.connectionRelease(connection);
});

function updateChipBalance(mmbrId, chipCode, changePending, changeGameBetting) {
  return new Promise(async(resolve, reject) => {
    let connection;
    try {
      connection = await mysqlCon.getConnectionPromiseRead();
      const query = mysql.format(sqlUpdateChipBalance, [changePending, changeGameBetting, mmbrId, chipCode]);
      const result = await mysqlCon.queryPromise(connection, query);
      // console.log(result);
      resolve(result);
    } catch (error) {
      console.error(error);
      reject(new Error540('ERR540'));
    }
    mysqlCon.connectionRelease(connection);
  });
}

module.exports = {
  getChipBalance,
  updateChipBalance
};

const sqlGetChipBalance = `
SELECT possession_quantity, result_pending_quantity, possession_quantity - result_pending_quantity as available
FROM gm_mmbr_assets
where mmbr_id = ? and chip_code = ?
`;

const sqlUpdateChipBalance = `
UPDATE gm_mmbr_assets
SET game_acmlt_quantity=game_acmlt_quantity+?, result_pending_quantity=result_pending_quantity+?, sys_process_dttm=CURRENT_TIMESTAMP(6)
WHERE mmbr_id=? and chip_code=?
`;
