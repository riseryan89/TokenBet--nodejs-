const mysql = require('mysql');
const mysqlCon = require("../../../dbapi/mysqlPromise");
const Error540 = require('../../../common/error/Error540');

function getGameBasicInfoList() {
  return new Promise(async(resolve, reject) => {
    try {
      var connection = await mysqlCon.getConnectionPromiseRead();
      const query = mysql.format(sqlGetGameBasicInfoList );
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

const getGameCancelCodes = () => new Promise(async(resolve, reject) => {
  try {
    var connection = await mysqlCon.getConnectionPromiseRead();
    const query = mysql.format(sqlGetGameCancelCodes);
    // console.log(query);
    const result = await mysqlCon.queryPromise(connection, query);
    // console.log(result);
    resolve(result.map(x => ({
      code: x.detail_code,
      message: x.detail_code_value,
    })));
  } catch (error) {
    console.error(error);
    reject(new Error540('ERR540'));
  }
  mysqlCon.connectionRelease(connection);
});

module.exports = {
  getGameBasicInfoList,
  getGameCancelCodes
};

const sqlGetGameBasicInfoList = `
select 
	info.game_id as game_id,
	info.coin_code as coin_code,
	info.base_coin_code as base_coin_code,
	info.game_time as game_time,
	code.detail_code_value as game_time_sec
from 
(SELECT game_id, coin_code, base_coin_code, game_time
FROM gm_game_basic_info
where beginning_date < now() and end_date is null) as info
inner join (select detail_code, detail_code_value from cm_code_detail where master_code = 'GM10') as code
on info.game_time = code.detail_code
`;

const sqlGetGameCancelCodes = `
SELECT master_code, detail_code, detail_code_name, detail_code_value, valid_yn
FROM cm_code_detail
WHERE master_code = 'GM23' and valid_yn = 'Y'
`;
