const mysql = require('mysql');
const mysqlCon = require("../../../dbapi/mysqlPromise");
const { Error540 } = require('../../../common/error');
const { saddAsync, sremAsync, smembersAsync } = require('../../../dbapi/redisClient');

function addNewBetting(gameId, mmbrId, type, amount, time) {
  return new Promise(async (resolve, reject) => {
    try {
      const obj = {
        mmbrId, type, amount, time,
      };
      await saddAsync(gameId, JSON.stringify(obj));
      resolve({
        gameId, mmbrId, type, amount, time, result: 'OK',
      });
    } catch (error) {
      reject();
    }
  });
}

function removeBetting(gameId, mmbrId, type, amount, time) {
  return new Promise(async (resolve, reject) => {
    try {
      amount = Number(amount);
      time = Number(time);
      const obj = {
        mmbrId, type, amount, time,
      };
      // console.log(JSON.stringify(obj));
      const ret = await sremAsync(gameId, JSON.stringify(obj));
      // console.log(ret);
      resolve({
        gameId, mmbrId, type, amount, time, result: ret ? 'OK' : 'NG',
      });
    } catch (error) {
      reject();
    }
  });
}

function getBettingList(gamePlayId) {
  return new Promise(async (resolve, reject) => {
    try {
      // console.log(gameId);
      const strData = await smembersAsync(gamePlayId);
      // console.log({gameId, strData});
      const data = JSON.parse(`[${strData}]`);
      // console.log(data);
      resolve(data);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

const getBettingListCurrent = (mmbrId) => new Promise(async(resolve, reject) => {
  let connection;
  try {
    connection = await mysqlCon.getConnectionPromiseRead();
    const query = mysql.format(sqlGetBettingListCurrent, [mmbrId]);
    // console.log(query);
    const result = await mysqlCon.queryPromise(connection, query);
    // console.log(result);
    resolve(result.map(x => ({
      mmbrId,
      type: x.bet_type,
      amount: x.amount,
      time: Number(x.bet_time),
      gameId: x.game_id,
      openTime: Number(x.open_time),
      closeTime: Number(x.close_time),
    })));
  } catch (error) {
    console.error(error);
    reject(new Error540('ERR540'));
  }
  mysqlCon.connectionRelease(connection);
});

const getMyGameResultHistory = (mmbrId, fromTime, toTime) => new Promise(async(resolve, reject) => {
  let connection;
  try {
    connection = await mysqlCon.getConnectionPromiseRead();
    const query = mysql.format(sqlGetMyGameResultHistory, [mmbrId, new Date(fromTime).toISOString(), new Date(toTime).toISOString()]);
    // console.log(query);
    const result = await mysqlCon.queryPromise(connection, query);
    // console.log(result);
    resolve(result.map(x => ({
      gameId: x.game_id,
      openTime: Number(x.open_time),
      closeTime: Number(x.close_time),
      openRate: Number(x.open_rate),
      closeRate: Number(x.close_rate),
      type: x.bet_type,
      amount: x.amount,
      gameResult: x.game_result,
      revenue: x.revenue,
      cancelCode: x.game_result_code
    })));
  } catch (error) {
    console.error(error);
    reject(new Error540('ERR540'));
  }
  mysqlCon.connectionRelease(connection);
});

const getRecentGameResult = (mmbrId, fromTime) => new Promise(async(resolve, reject) => {
  let connection;
  try {
    connection = await mysqlCon.getConnectionPromiseRead();
    const query = mysql.format(sqlGetRecentGameResult, [mmbrId, fromTime]);
    // console.log(query);
    const result = await mysqlCon.queryPromise(connection, query);
    // console.log(result);
    resolve(result.map(x => ({
      mmbrId,
      gameId: x.game_id,
      gameOrder: x.game_order,
      betTime: Number(x.participation_dttm),
      betType: x.choice_option,
      betAmount: Number(x.participate_quantity),
      gameResult: Number(x.participate_result),
      acquireAmount: Number(x.dividend_quantity),
      resultTime: Number(x.result_process_dttm),
      gap: x.gap
    })));
  } catch (error) {
    console.error(error);
    reject(new Error540('ERR540', 'getRecentGameResult'));
  }
  mysqlCon.connectionRelease(connection);
});

module.exports = {
  addNewBetting,
  removeBetting,
  getBettingList,
  getBettingListCurrent,
  getRecentGameResult,
  getMyGameResultHistory,
};

const sqlGetBettingListCurrent = `
select mmbr.game_id as game_id,
	mmbr.mmbr_id as mmbr_id,
	mmbr.participation_dttm as bet_time,
	mmbr.choice_option as bet_type,
	mmbr.participate_quantity as amount,
	info.beginning_dttm as open_time,
	info.end_dttm as close_time
from (select game_id, game_order, mmbr_id, participation_dttm, choice_option, participate_quantity from gm_mmbr_game_info
where mmbr_id = 1001 and participate_result is null) as mmbr
INNER JOIN (SELECT game_id, game_order, beginning_dttm, end_dttm from gm_each_game_info ) as info
ON mmbr.game_id = info.game_id and mmbr.game_order = info.game_order
`;

const sqlGetRecentGameResult = `
SELECT game_id, game_order, participation_dttm, choice_option, participate_quantity, participate_result, dividend_quantity, result_process_dttm, UNIX_TIMESTAMP() - UNIX_TIMESTAMP(result_process_dttm) as gap, sys_process_dttm
FROM gm_mmbr_game_info
WHERE mmbr_id = ? and UNIX_TIMESTAMP(result_process_dttm) > ? / 1000;;
`;

const  sqlGetMyGameResultHistory = `
select mmbr.game_id as game_id,
	info.beginning_dttm as open_time,
	info.end_dttm as close_time,
	info.begin_rate as open_rate,
	info.end_rate as close_rate,
	mmbr.choice_option as bet_type,
	mmbr.participate_quantity as amount,
	mmbr.participate_result as game_result,
  mmbr.dividend_quantity as revenue,
  info.game_result_code
from (select game_id, game_order, mmbr_id, participation_dttm, choice_option, participate_quantity, participate_result, dividend_quantity from gm_mmbr_game_info
where mmbr_id = ? and participate_result is not null) as mmbr
INNER JOIN (SELECT game_id, game_order, beginning_dttm, end_dttm, begin_rate, end_rate, game_result_code from gm_each_game_info
where beginning_dttm >= ? and end_dttm <= ?) as info
ON mmbr.game_id = info.game_id and mmbr.game_order = info.game_order
`;
