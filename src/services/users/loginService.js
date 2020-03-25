const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const jwt = require('jsonwebtoken');
const tokenInfo = require('../../../conf/tokenInfo');
const Error440 = require('../../common/error/Error440');
const { jwtVerify } = require('../../common/promisify');
const daoMmbr = require('./dao/daoMmbr');
const daoOtp = require('./dao/daoOtp');

const login = (emailAddr, password) => new Promise(async(resolve, reject) => {
  try {
    const mmbrInfo = await daoMmbr.getMmbrInfo(emailAddr);
    if (mmbrInfo.length === 0) {
      throw new Error440('ERR440_NOT_EXIST', 'not exist');
    }
    
    if (mmbrInfo[0].activationClass !== '1') {
      throw new Error440('ERR440_NOT_ACTIVE', 'not active');
    }
    
    const comparedPw = bcrypt.compareSync(password, mmbrInfo[0].passwd);
    if(!comparedPw) {
      throw new Error440('ERR440_NOT_MATCH_PASSWORD', 'not match password');
    }

    if (mmbrInfo[0].twoFactorUse === 'Y') {
      // return temp token
      const login2FAtoken = jwt.sign({
        subject: 'login2FA',
        exp: Math.floor(new Date().getTime()/1000) + 3600, // Note: in seconds!
        mmbrId: mmbrInfo[0].mmbrId,
      }, tokenInfo.access.jwtSecret);
      // console.log(token);
      resolve({ login2FAtoken });
    } else {
      // retrun login token
      const accessToken = getAccessToken(mmbrInfo[0]);
      const refreshToken = getRefreshToken(mmbrInfo[0]);
      // console.log(accessToken, refreshToken);
      resolve({ accessToken, refreshToken });
    }
  } catch (error) {
    console.error(error);
    reject(error);
  }
});

const login2FA = (tokenLogin2FA, otpCode) => new Promise(async(resolve, reject) => {
  try {
    const decoded = await jwtVerify(tokenLogin2FA, tokenInfo.access.jwtSecret);
    // console.log(decoded);
    const mmbrCerti = await daoOtp.getMmbrCerti(decoded.mmbrId);
    // console.log(mmbrCerti);

    const verified = speakeasy.totp.verify({
      secret: mmbrCerti.certiNo,
      encoding: 'base32',
      token: otpCode
    });
    if (!verified) {
      throw new Error440('ERR440_OTP');
    }

    const mmbrInfo = await daoMmbr.getMmbrInfoById(decoded.mmbrId);
    if (mmbrInfo.length === 0) {
      throw new Error440('ERR440_NOT_EXIST', 'not exist');
    }
    const accessToken = getAccessToken(mmbrInfo[0]);
    const refreshToken = getRefreshToken(mmbrInfo[0]);
    // console.log(accessToken, refreshToken);
    resolve({ accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    reject(error);
  }
});

const refreshAccessToken = (refreshToken) => new Promise(async(resolve, reject) => {
  jwt.verify(refreshToken, tokenInfo.refresh.jwtSecret, function(err, decoded) {
    // console.log(decoded);
    if (err) {
      throw err;
    }

    daoMmbr.getMmbrInfoById(decoded.mmbrId)
    .then(mmbrInfo => {
      if (mmbrInfo.length === 0) {
        throw new Error440('ERR440_NOT_EXIST', 'not exist');
      }
      if (mmbrInfo[0].activationClass !== '1') {
        throw new Error440('ERR440_NOT_ACTIVE', 'not active');
      }
      const accessToken = getAccessToken(mmbrInfo[0]);
      // console.log(accessToken);
      resolve({ accessToken });
    })
    .catch(error => reject(error));
  });
});

const getAccessToken = (mmbrInfo) => (
  jwt.sign({
    subject: 'access',
    exp: Math.floor(new Date().getTime()/1000) + 60 * 15, // Note: in seconds!
    mmbrId: mmbrInfo.mmbrId,
    emailAddr: mmbrInfo.emailAddr,
    surname: mmbrInfo.surName,
    givenname: mmbrInfo.givenName,
    twoFactorUse: mmbrInfo.twoFactorUse === 'Y' ? true : false
  }, tokenInfo.access.jwtSecret)
);

const getRefreshToken = (mmbrInfo) => (
  jwt.sign({
    subject: 'refresh',
    exp: Math.floor(new Date().getTime()/1000) + 3600 * 4, // Note: in seconds!
    mmbrId: mmbrInfo.mmbrId,
  }, tokenInfo.refresh.jwtSecret)
);

module.exports = {
  login,
  login2FA,
  refreshAccessToken,
};
