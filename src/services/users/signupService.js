const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tokenInfo = require('../../../conf/tokenInfo');
const Error440 = require('../../common/error/Error440');
const daoMmbr = require('./dao/daoMmbr');
const activationMail = require('./mailer/activationMail');

function signUp(givenName, surName, emailAddr, password) {
  return new Promise(async(resolve, reject) => {
    let salt = bcrypt.genSaltSync(10);
    let hashedPw = bcrypt.hashSync(password, salt);

    try {
      const existMmbr = await daoMmbr.getMmbrInfo(emailAddr);
      if (existMmbr.length !== 0) {
        // already exist
        throw new Error440('ERR440_ALREADY_EXIST', 'already exist');
      }
      const data = await daoMmbr.addNewMmbrInfo(givenName, surName, emailAddr, hashedPw);
      if (data.affectedRows > 0) {
        resolve({});
      } else {
        throw new Error440('ERR440_111', '?');
      }

      const activationTokenStr = jwt.sign({
          subject: 'activation',
          email: emailAddr,
          exp: Math.floor(new Date().getTime()/1000) + 7*24*60*60 // Note: in seconds!
        }, tokenInfo.signUp.jwtSecret
      );
      activationMail.sendMail(emailAddr, 'en', activationTokenStr);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

function sendActivationMail(emailAddr) {
  return new Promise(async(resolve, reject) => {
    try {
      const existMmbr = await daoMmbr.getMmbrInfo(emailAddr);
      if (existMmbr.length === 0) {
        // already exist
        throw new Error440('ERR440_NOT_EXIST', 'not exist');
      }
      if (existMmbr[0].activationClass !== 0) {
        console.log('already activated');
        resolve();
        return;
      }
      const activationTokenStr = jwt.sign({
          subject: 'activation',
          email: emailAddr,
          exp: Math.floor(new Date().getTime()/1000) + 7*24*60*60 // Note: in seconds!
        }, tokenInfo.signUp.jwtSecret
      );
      activationMail.sendMail(emailAddr, 'en', activationTokenStr);
      resolve();
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

function activation(activationToken) {
  return new Promise(async(resolve, reject) => {
    try {
      const decoded = await jwtVerify(activationToken);
      const existMmbr = await daoMmbr.getMmbrInfo(decoded.email);
      if (existMmbr.length === 0) {
        // already exist
        throw new Error440('ERR440_NOT_EXIST', 'not exist');
      }
      const data = await daoMmbr.updateMmbrInfo('1', null, decoded.email);
      if (data.affectedRows > 0) {
        resolve({});
      } else {
        throw new Error440('ERR440_111', '?');
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

function jwtVerify(tokenString) {
  return new Promise(async(resolve, reject) => {
    jwt.verify(tokenString, tokenInfo.mail.jwtSecret, function(err, decoded) {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

module.exports.signUp = signUp;
module.exports.sendActivationMail = sendActivationMail;
module.exports.activation = activation;
