const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const tokenInfo = require('../../../conf/tokenInfo');
const Error440 = require('../../common/error/Error440');
const daoMmbr = require('./dao/daoMmbr');

const findPwMail = require('./mailer/findPwMail');

function findPwSendEmail(emailAddr){
  return new Promise(async(resolve, reject) => {
    try {
      const mmbrInfo = await daoMmbr.getMmbrInfo(emailAddr);
      if (mmbrInfo.length == 0) {
        throw new Error440('ERR440_NOT_EXIST', 'not exist'); 
      }

      const tokenString = jwt.sign({
          subject: "findPw",
          email: emailAddr,
          exp: Math.floor(new Date().getTime()/1000) + 7*24*60*60 // Note: in seconds!
        }, tokenInfo.forgotPw.jwtSecret
      );
      
      findPwMail.sendMail(emailAddr, 'en', tokenString);
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
}

function changePassword(emailAddr, newPassword, accessIp, oldPassword = null) {  
  if(newPassword.search(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%^&*()_+='";:/?.\[\]|\\~>,<₩]).{8,}$/g) < 0){
    throw new Error440('ERR_440_USERS_0108', 'Input value error.');
  }

  return new Promise(async(resolve, reject) => {
    try {
      const mmbrInfo = await daoMmbr.getMmbrInfo(emailAddr);
      if (mmbrInfo.length == 0) {
        throw new Error440('ERR440_NOT_EXIST', 'not exist'); 
      }

      if (oldPassword !== null) {
        // check valid old password
        const comparedPw = bcrypt.compareSync(oldPassword, mmbrInfo[0].passwd);
        if(!comparedPw) {
          throw new Error440('ERR440_NOT_MATCH_PASSWORD', 'not match password');
        }
      }

      const mmbrId = mmbrInfo[0].mmbrId;
      let salt = bcrypt.genSaltSync(10);
      let hashedPw = bcrypt.hashSync(newPassword, salt);

      const reslut = await daoMmbr.changePassword(mmbrId, hashedPw, accessIp);
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports.findPwSendEmail = findPwSendEmail;
module.exports.changePassword = changePassword;
