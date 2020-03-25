const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const tokenInfo = require('../../../conf/tokenInfo');
const { Error440 } = require('../../common/error');
const { jwtVerify } = require('../../common/promisify');
const daoOtp = require('./dao/daoOtp');

const otpActivationMail = require('./mailer/otpActivationMail');

const register = (mmbrId, userSecret, otpCode, emailAddr, accessIp) => new Promise(async(resolve, reject) => {
  try {
    // verify userSecret, otpCode
    const verified = speakeasy.totp.verify({
        secret: userSecret,
        encoding: 'base32',
        token: otpCode
    });
    if (!verified) {
      throw new Error440('ERR440_OTP');
    }

    // insert/update database
    await daoOtp.register(mmbrId, userSecret, accessIp);

    // send activation mail
    const tokenString = jwt.sign({
        subject: "otp/activation",
        mmbrId: mmbrId,
        exp: Math.floor(new Date().getTime()/1000) + 7*24*60*60 // Note: in seconds!
      }, tokenInfo.optActivate.jwtSecret
    );
    otpActivationMail.sendMail(emailAddr, 'en', tokenString);

    resolve(true);
  } catch (error) {
    reject(error);
  }
});

const activation = (activationToken) => new Promise(async(resolve, reject) => {
  try {
    const decoded = await jwtVerify(activationToken, tokenInfo.optActivate.jwtSecret);
    const { mmbrId } = decoded;

    daoOtp.updateCerti4Activation(mmbrId);

    resolve({});
  } catch (error) {
    console.error(error);
    reject(error);
  }
});

const deactivation = (mmbrId, otpCode) => new Promise(async(resolve, reject) => {
  try {
    const certiData = await daoOtp.getMmbrCerti(mmbrId);
    const userSecret = certiData.certiNo;
    // console.log({userSecret, otpCode});

    // verify userSecret, otpCode
    const verified = speakeasy.totp.verify({
      secret: userSecret,
      encoding: 'base32',
      token: otpCode
    });
    if (!verified) {
      throw new Error440('ERR440_OTP');
    }

    daoOtp.updateCerti4Deactivation(mmbrId);

    resolve({});
  } catch (error) {
    console.error(error);
    reject(error);
  }
});

const getCertiNo = (mmbrId) =>  new Promise(async(resolve, reject) => {
  try {
    const certiData = await daoOtp.getMmbrCerti(mmbrId);
    resolve(certiData);
  } catch (error) {
    console.error(error);
    reject(error);
  }
});

module.exports = {
  register,
  activation,
  getCertiNo,
  deactivation
};
