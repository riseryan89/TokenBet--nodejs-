const mysql = require('mysql');
const mysqlCon = require("../../../dbapi/mysqlPromise");
const Error540 = require('../../../common/error/Error540');

function getMmbrPassword(mmbrId) {
  return new Promise(async(resolve, reject) => {
    try {
      var connection = await mysqlCon.getConnectionPromiseRead();
      const query = mysql.format(sqlGetMmbrPassword, [mmbrId] );
      const result = await mysqlCon.queryPromise(connection, query);
      // console.log(result);
      if (result.length === 0) {
        resolve(null);
      } else {
        resolve({password: result[0].passwd});
      }
    } catch (error) {
      console.error(error);
      reject(new Error540('ERR540'));
    }
    mysqlCon.connectionRelease(connection);
  });
}

const sqlGetMmbrPassword = `
SELECT passwd, passwd_set_dttm
FROM cu_mmbr_pswd
where mmbr_id = ?;
`;

module.exports = {
  getMmbrPassword
};
