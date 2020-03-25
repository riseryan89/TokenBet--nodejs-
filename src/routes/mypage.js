const express = require('express');
const router = express.Router();
const loginToken = require('../common/token/loginToken');
const Error440 = require('../common/error/Error440');
const Error540 = require('../common/error/Error540');
const commonJs = require('../common/common'); //공통함수
const mmbrpswdService = require('../services/users/mmbrpswdService');
const otpService = require('../services/users/otpService');

router.put('/updtPw', loginToken, function(req, res){
  // const mmbrId = req.decodedToken.mmbrId;
  const emailAddr = req.decodedToken.emailAddr;
  const {currentPw, newPw} = req.body;

  if (currentPw === undefined || newPw === undefined) {
    res.status(440).send(new Error440('ERR440_INVALID_PARAMETER'));
    return;
  }

  const illegalString = commonJs.findIllegalString([currentPw, newPw]);
  if (illegalString !== '') {
    res.status(440).send(new Error440('ERR_440_ILLEGAL_PARAMS_0101', `illegal parameter: ${illegalString}`));
    return;
  }

  if(newPw.search(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%^&*()_+='";:/?.\[\]|\\~>,<₩]).{8,}$/g) < 0){    
    res.status(440).send(new Error440('ERR_440_MYPAGE_0104', 'Input value error.'));  
    return;
  }
  const accessIp = commonJs.getClientIp(req);
  
  mmbrpswdService.changePassword(emailAddr, newPw, accessIp, currentPw)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.post('/otp/register', loginToken, function(req, res) {
  const { mmbrId, emailAddr } = req.decodedToken;
  const { userSecret, otpCode } = req.body;
  const accessIp = commonJs.getClientIp(req);

  console.log('register', mmbrId, userSecret, otpCode, emailAddr, accessIp);

  if (userSecret === undefined || otpCode === undefined) {
    res.status(440).send(new Error440('ERR440_INVALID_PARAMETER'));
    return;
  }

  const illegalString = commonJs.findIllegalString([userSecret, otpCode]);
  if (illegalString !== '') {
    res.status(440).send(new Error440('ERR_440_ILLEGAL_PARAMS_0101', `illegal parameter: ${illegalString}`));
    return;
  }

  otpService.register(mmbrId, userSecret, otpCode, emailAddr, accessIp)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.post('/otp/activation', function(req, res) {
  const {activationToken} = req.body;

  console.log({title: 'activation', activationToken});

  if (activationToken === undefined) {
    res.status(440).send(new Error440('ERR440_INVALID_PARAMETER'));
    return;
  }

  const illegalString = commonJs.findIllegalString([activationToken]);
  if (illegalString !== '') {
    res.status(440).send(new Error440('ERR_440_ILLEGAL_PARAMS_0101', `illegal parameter: ${illegalString}`));
    return;
  }

  otpService.activation(activationToken)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.get('/otp/certiNo', loginToken, function(req, res) {
  const { mmbrId, emailAddr } = req.decodedToken;
  const accessIp = commonJs.getClientIp(req);

  console.log({title: 'certiNo', mmbrId, emailAddr, accessIp});

  otpService.getCertiNo(mmbrId)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.put('/otp/deactivation', loginToken, function(req, res) {
  const { mmbrId } = req.decodedToken;
  const { otpCode } = req.body;

  console.log({title: 'deactivation', mmbrId, otpCode});

  if (otpCode === undefined) {
    res.status(440).send(new Error440('ERR440_INVALID_PARAMETER'));
    return;
  }

  const illegalString = commonJs.findIllegalString([otpCode]);
  if (illegalString !== '') {
    res.status(440).send(new Error440('ERR_440_ILLEGAL_PARAMS_0101', `illegal parameter: ${illegalString}`));
    return;
  }

  otpService.deactivation(mmbrId, otpCode)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

module.exports = router;
