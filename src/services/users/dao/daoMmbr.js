const mysql = require('mysql');
const mysqlCon = require("../../../dbapi/mysqlPromise");
const Error540 = require('../../../common/error/Error540');

function getMmbrInfo(emailAddr) {
  return new Promise(async(resolve, reject) => {
    try {
      var connection = await mysqlCon.getConnectionPromiseRead();
      const query = mysql.format(sqlGetMmbrInfo, [emailAddr] );
      const result = await mysqlCon.queryPromise(connection, query);
      // console.log(result);
      resolve(result.map(x => ({
        mmbrId: x.mmbr_id,
        givenName: x.given_name,
        surName: x.surname,
        emailAddr: x.email_addr,
        passwd: x.passwd,
        activationClass: x.activation_classfy, 
        twoFactorUse: x.two_factor_use_yn,
      })));
    } catch (error) {
      console.error(error);
      reject(new Error540('ERR540', 'getMmbrInfo'));
    }
    mysqlCon.connectionRelease(connection);
  });
}

function getMmbrInfoById(mmbrId) {
  return new Promise(async(resolve, reject) => {
    try {
      var connection = await mysqlCon.getConnectionPromiseRead();
      const query = mysql.format(sqlGetMmbrInfoById, [mmbrId] );
      const result = await mysqlCon.queryPromise(connection, query);
      // console.log(result);
      resolve(result.map(x => ({
        mmbrId: x.mmbr_id,
        givenName: x.given_name,
        surName: x.surname,
        emailAddr: x.email_addr,
        passwd: x.passwd,
        activationClass: x.activation_classfy, 
        twoFactorUse: x.two_factor_use_yn,
      })));
    } catch (error) {
      console.error(error);
      reject(new Error540('ERR540', 'getMmbrInfo'));
    }
    mysqlCon.connectionRelease(connection);
  });
}

function addNewMmbrInfo(givenName, surName, emailAddr, password) {
  return new Promise(async(resolve, reject) => {
    try {
      var connection = await mysqlCon.getConnectionPromiseWrite();
      await mysqlCon.beginTransactionPromise(connection);

      const query = mysql.format(sqlAddNewMmbrInfo, [givenName, surName, emailAddr]);
      // console.log(query);
      const resultInsert = await mysqlCon.queryPromise(connection, query);
      // console.log(resultInsert);
      if (resultInsert.affectedRows === 0) {
        throw new Error540('ERR540_ADDNEWMEMBER_1', 'addMmbrInfo');
      }
      const queryGet = mysql.format(sqlGetMmbrInfo, [emailAddr]);
      // console.log(queryGet);
      const resultGet = await mysqlCon.queryPromise(connection, queryGet);
      // console.log(resultGet);
      if (resultGet.length === 0) {
        throw new Error540('ERR540_ADDNEWMEMBER_2', 'addMmbrInfo');
      }
      const mmbrId = resultGet[0].mmbr_id;
      const queryPw = mysql.format(sqlAddNewPassword, [mmbrId, password]);
      const resultPw = await mysqlCon.queryPromise(connection, queryPw);
      // console.log(resultPw);
      if (resultPw.affectedRows === 0) {
        throw new Error540('ERR540_ADDNEWMEMBER_3', 'addMmbrInfo');
      }

      await mysqlCon.commitPromise(connection);

      resolve({});
    } catch (error) {
      console.error(error);
      reject(new Error540('ERR540_ADDNEWMEMBER_4', 'addMmbrInfo'));
    }
    mysqlCon.connectionRelease(connection);
  });
}

function updateMmbrInfo(activationState, twoFactorUse, emailAddr) {
  return new Promise(async(resolve, reject) => {
    try {
      var connection = await mysqlCon.getConnectionPromiseWrite();
      
      const queryGet = mysql.format(sqlGetMmbrInfo, [emailAddr]);
      const resultGet = await mysqlCon.queryPromise(connection, queryGet);
      if (resultGet.length === 0) {
        throw(new Error540('ERR540_ss', 'not found'));
      }

      const mmbrId = resultGet[0].mmbr_id;

      const queryUpdate = mysql.format(sqlUpdateMmbrInfo, [activationState, twoFactorUse, mmbrId]);
      const resultUpdate = await mysqlCon.queryPromise(connection, queryUpdate);
      // console.log(resultUpdate);

      await mysqlCon.commitPromise(connection);
      resolve({});
    } catch (error) {
      console.error(error);
      reject(new Error540('ERR540', 'getMmbrInfo'));
    }
    mysqlCon.connectionRelease(connection);
  });
}

function changePassword(mmbrId, password, accessIp) {
  return new Promise(async(resolve, reject) => {
    try {
      var connection = await mysqlCon.getConnectionPromiseWrite();
      
      const queryInsHist = mysql.format(sqlInsertPasswordHistory, [accessIp, mmbrId, mmbrId, mmbrId]);
      const resultInsHist = await mysqlCon.queryPromise(connection, queryInsHist);
      // console.log(resultInsHist);
      
      const queryUpd = mysql.format(sqlUpdatePassword, [password, mmbrId]);
      const resultUpd = await mysqlCon.queryPromise(connection, queryUpd);
      // console.log(resultUpd);

      await mysqlCon.commitPromise(connection);
      resolve({});
    } catch (error) {
      console.error(error);
      reject(new Error540('ERR540', 'getMmbrInfo'));
    }
    mysqlCon.connectionRelease(connection);
  });
}

const sqlGetMmbrInfo = `
select INFO.mmbr_id as mmbr_id, given_name, surname, email_addr, passwd, application_date, terms_agree_dttm, activation_classfy, two_factor_use_yn, self_rcmnd_cd, rcmnd_cd from
(SELECT mmbr_id, given_name, surname, email_addr, application_date, terms_agree_dttm, activation_classfy, two_factor_use_yn, self_rcmnd_cd, rcmnd_cd, sys_process_dttm
FROM cu_mmbr_info) as INFO
LEFT JOIN
(SELECT mmbr_id, passwd, passwd_set_dttm, sys_process_dttm
FROM cu_mmbr_pswd) as PSWD
on INFO.mmbr_id = PSWD.mmbr_id
where INFO.email_addr = ?;
`;

const sqlGetMmbrInfoById = `
select INFO.mmbr_id as mmbr_id, given_name, surname, email_addr, passwd, application_date, terms_agree_dttm, activation_classfy, two_factor_use_yn, self_rcmnd_cd, rcmnd_cd from
(SELECT mmbr_id, given_name, surname, email_addr, application_date, terms_agree_dttm, activation_classfy, two_factor_use_yn, self_rcmnd_cd, rcmnd_cd, sys_process_dttm
FROM cu_mmbr_info) as INFO
LEFT JOIN
(SELECT mmbr_id, passwd, passwd_set_dttm, sys_process_dttm
FROM cu_mmbr_pswd) as PSWD
on INFO.mmbr_id = PSWD.mmbr_id
where INFO.mmbr_id = ?;
`;

const sqlAddNewMmbrInfo = `
INSERT INTO cu_mmbr_info
(mmbr_id, given_name, surname, email_addr, application_date, terms_agree_dttm, activation_classfy, two_factor_use_yn, self_rcmnd_cd, rcmnd_cd, sys_process_dttm)
select
	IFNULL(MAX(mmbr_id), 1000) + 1,
	?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '0', 'N', '', '', CURRENT_TIMESTAMP(6)
FROM cu_mmbr_info
`;

const sqlAddNewPassword = `
INSERT INTO cu_mmbr_pswd
(mmbr_id, passwd, passwd_set_dttm, sys_process_dttm)
VALUES(?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP(6));
`;

const sqlUpdateMmbrInfo = `
UPDATE cu_mmbr_info
SET activation_classfy=IFNULL(?, activation_classfy), two_factor_use_yn=IFNULL(?, two_factor_use_yn), sys_process_dttm=CURRENT_TIMESTAMP(6)
WHERE mmbr_id=?;
`;

const sqlUpdatePassword = `
UPDATE cu_mmbr_pswd
SET passwd = ?, passwd_set_dttm=CURRENT_TIMESTAMP, sys_process_dttm=CURRENT_TIMESTAMP(6)
WHERE mmbr_id = ?
`;
const sqlInsertPasswordHistory = `
INSERT INTO cu_mmbr_pswd_h
(mmbr_id, hist_order, access_ip, hist_gen_dttm, passwd, passwd_set_dttm, sys_process_dttm)
select pswd.mmbr_id, hist.historder, ? as access_ip, CURRENT_TIMESTAMP(6) as hist_gen_dttm, pswd.passwd, pswd.passwd_set_dttm, CURRENT_TIMESTAMP(6) as sys_process_dttm from
(select mmbr_id, passwd, passwd_set_dttm
FROM cu_mmbr_pswd where mmbr_id = ?) pswd
inner join (select ? as mmbr_id, ifnull(max(hist_order), 0) + 1 as historder
FROM cu_mmbr_pswd_h where mmbr_id = ?) hist
on pswd.mmbr_id = hist.mmbr_id
`;

module.exports = {
  getMmbrInfo,
  getMmbrInfoById,
  addNewMmbrInfo,
  updateMmbrInfo,
  changePassword,
};
