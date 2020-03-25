const mysql = require('mysql');
const mysqlCon = require("../../../dbapi/mysqlPromise");
const {Error540} = require('../../../common/error');

const getMmbrCerti = (mmbrId) => new Promise(async(resolve, reject) => {
  try {
    var connection = await mysqlCon.getConnectionPromiseRead();
    const query = mysql.format(sqlGetMmbrCerti, [mmbrId] );
    // console.log(query);
    const res = await mysqlCon.queryPromise(connection, query);
    // console.log(res);
    if (res.length === 0) {
      throw new Error540('ERR540');
    }
    resolve({
      certiNo: res[0].two_chnl_certi_number
    });
  } catch (error) {
    console.error(error);
    reject(new Error540('ERR540'));
  }
  mysqlCon.connectionRelease(connection);
});

const register = (mmbrId, certiNo, accessIp) => new Promise(async(resolve, reject) => {
  try {
    var connection = await mysqlCon.getConnectionPromiseWrite();
    await mysqlCon.beginTransactionPromise(connection);

    const queryGetMmbrCerti = mysql.format(sqlGetMmbrCerti, [mmbrId]);
    // console.log(queryGetMmbrCerti);
    const resGetMmbrCerti = await mysqlCon.queryPromise(connection, queryGetMmbrCerti);
    // console.log(resGetMmbrCerti);
    if (resGetMmbrCerti.length === 0) {
      // first time : insert... end
      const queryInsMmbrCerti = mysql.format(sqlInsMmbrCerti, [mmbrId, certiNo]);
      // console.log(queryInsMmbrCerti);
      const resInsMmbrCerti = await mysqlCon.queryPromise(connection, queryInsMmbrCerti);
      // console.log(resInsMmbrCerti);
      if (resInsMmbrCerti.affectedRows === 0) {
        throw new Error540('ERR540_OTP1', 'register');
      }
    } else {
      // insert to history and update
      const queryInsHistory = mysql.format(sqlInsHistory, [accessIp, mmbrId, mmbrId, mmbrId]);
      // console.log(queryInsHistory);
      const resInsHistory = await mysqlCon.queryPromise(connection, queryInsHistory);
      // console.log(resInsHistory);
      if (resInsHistory.affectedRows === 0) {
        throw new Error540('ERR540_OTP1HI', 'register');
      }
      const queryUptCurrent = mysql.format(sqlUptCertiNew, [certiNo, mmbrId]);
      // console.log(queryUptCurrent);
      const resUptCurrent = await mysqlCon.queryPromise(connection, queryUptCurrent);
      // console.log(resUptCurrent);
      if (resUptCurrent.affectedRows === 0) {
        throw new Error540('ERR540_OTP1HI', 'register');
      }
    }

    await mysqlCon.commitPromise(connection);

    resolve({});
  } catch (error) {
    console.error(error);
    connection.rollback();
    reject(new Error540('ERR540_ADDNEWMEMBER_4', 'addMmbrInfo'));
  }
  mysqlCon.connectionRelease(connection);
});

const updateCerti4Activation = (mmbrId) => new Promise(async(resolve, reject) => {
  try {
    var connection = await mysqlCon.getConnectionPromiseWrite();
    
    const queryUptCertiAct = mysql.format(sqlUptCertiAct, [mmbrId]);
    const resultUptCertiAct = await mysqlCon.queryPromise(connection, queryUptCertiAct);
    if (resultUptCertiAct.affectedRows === 0) {
      throw(new Error540('ERR540_ss'));
    }

    const queryUpdMmbrInfo = mysql.format(sqlUpdMmbrInfo, ['Y', mmbrId]);
    const resUpdMmbrInfo = await mysqlCon.queryPromise(connection, queryUpdMmbrInfo);
    if (resUpdMmbrInfo.affectedRows === 0) {
      throw(new Error540('ERR540_ss'));
    }
    // console.log(resUpdMmbrInfo);

    await mysqlCon.commitPromise(connection);
    resolve({});
  } catch (error) {
    connection.rollback();
    console.error(error);
    reject(new Error540('ERR540'));
  }
  mysqlCon.connectionRelease(connection);
});

const updateCerti4Deactivation = (mmbrId) => new Promise(async(resolve, reject) => {
  try {
    var connection = await mysqlCon.getConnectionPromiseWrite();
    
    const queryUptCertiDeact = mysql.format(sqlUptCertiDeact, [mmbrId]);
    const resultUptCertiDeact = await mysqlCon.queryPromise(connection, queryUptCertiDeact);
    if (resultUptCertiDeact.affectedRows === 0) {
      throw(new Error540('ERR540_ss'));
    }

    const queryUpdMmbrInfo = mysql.format(sqlUpdMmbrInfo, ['N', mmbrId]);
    const resUpdMmbrInfo = await mysqlCon.queryPromise(connection, queryUpdMmbrInfo);
    if (resUpdMmbrInfo.affectedRows === 0) {
      throw(new Error540('ERR540_ss'));
    }
    // console.log(resUpdMmbrInfo);

    await mysqlCon.commitPromise(connection);
    resolve({});
  } catch (error) {
    connection.rollback();
    console.error(error);
    reject(new Error540('ERR540'));
  }
  mysqlCon.connectionRelease(connection);
});

const sqlGetMmbrCerti = `
SELECT two_chnl_certi_number, two_chnl_certi_set_dttm, otp_activation_dttm
FROM cu_mmbr_certi
WHERE mmbr_id = ?
  AND otp_deactive_dttm is NULL
ORDER BY two_chnl_certi_set_dttm DESC
`;

const sqlInsMmbrCerti = `
INSERT INTO cu_mmbr_certi
(mmbr_id, two_chnl_certi_number, two_chnl_certi_set_dttm, sys_process_dttm)
VALUES(?, ?, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6))
`;

const sqlUpdMmbrInfo = `
UPDATE cu_mmbr_info
SET two_factor_use_yn=?, sys_process_dttm=CURRENT_TIMESTAMP(6)
WHERE mmbr_id=?
`;

const sqlUptCertiNew = `
UPDATE cu_mmbr_certi
SET two_chnl_certi_number=?, two_chnl_certi_set_dttm=CURRENT_TIMESTAMP(6), sys_process_dttm=CURRENT_TIMESTAMP(6)
WHERE mmbr_id=?;
`;

const sqlUptCertiAct = `
UPDATE cu_mmbr_certi
SET otp_activation_dttm=CURRENT_TIMESTAMP(6), sys_process_dttm=CURRENT_TIMESTAMP(6)
WHERE mmbr_id=?;
`;

const sqlUptCertiDeact = `
UPDATE cu_mmbr_certi
SET otp_deactive_dttm=CURRENT_TIMESTAMP(6), sys_process_dttm=CURRENT_TIMESTAMP(6)
WHERE mmbr_id=?;
`;

const sqlInsHistory = `
INSERT INTO cu_mmbr_certi_h
(mmbr_id, hist_order, access_ip, hist_gen_dttm, two_chnl_certi_number, two_chnl_certi_set_dttm, otp_activation_dttm, otp_deactive_dttm, sys_process_dttm)
select curr.mmbr_id, hist.historder, ? as access_ip, CURRENT_TIMESTAMP(6) as hist_gen_dttm,
	curr.two_chnl_certi_number, curr.two_chnl_certi_set_dttm, curr.otp_activation_dttm, curr.otp_deactive_dttm, CURRENT_TIMESTAMP(6) as sys_process_dttm
from
(select mmbr_id, two_chnl_certi_number, two_chnl_certi_set_dttm, otp_activation_dttm, otp_deactive_dttm
FROM cu_mmbr_certi where mmbr_id = ?) curr
inner join (select ? as mmbr_id, ifnull(max(hist_order), 0) + 1 as historder
FROM cu_mmbr_certi_h where mmbr_id = ?) hist
on curr.mmbr_id = hist.mmbr_id
`;

module.exports = {
  getMmbrCerti,
  register,
  updateCerti4Activation,
  updateCerti4Deactivation
};
