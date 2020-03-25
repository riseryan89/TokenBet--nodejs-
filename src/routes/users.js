const express = require('express');
const router = express.Router();
const commonJs = require('../common/common');
const loginToken = require('../common/token/loginToken');
const forgotPwTokenVerify = require('../common/token/forgotPwToken');
const Error440 = require('../common/error/Error440');
const mmbrpswdService = require('../services/users/mmbrpswdService');
const signupService = require('../services/users/signupService');
const loginService = require('../services/users/loginService');

router.post('/login',  function(req, res) {
  const emailAddr = req.body.emailAddr;
  const password = req.body.password;
  const lang = req.body.lang;

  if (typeof emailAddr == 'undefined' || emailAddr == '' ||
      typeof password == 'undefined' || password == '' ||
      typeof lang == 'undefined' || lang == '') {
    res.status(440).send(new Error440('ERR_440_USERS_0101', 'Input value error.'));
    return;
  }

  if(commonJs.sqlInjection(emailAddr)){
    res.status(440).send(new Error440('ERR_440_INPUT_0101', 'Input value error.'));
    return;
  }
  loginService.login(emailAddr, password)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.post('/login2FA', function(req, res) {
  const { tokenLogin2FA, otpCode } = req.body;
  // console.log({ tokenLogin2FA, otpCode });

  if (typeof otpCode == 'undefined' || otpCode == '') {
    res.status(440).send(new Error440('ERR_440_USERS_0101', 'Input value error.'));
    return;
  }

  if(commonJs.sqlInjection(otpCode)){
    res.status(440).send(new Error440('ERR_440_INPUT_0101', 'Input value error.'));
    return;
  }

  loginService.login2FA(tokenLogin2FA, otpCode)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.post('/token', function(req, res) {
  const { refreshToken } = req.body;
  console.log('token', refreshToken);

  if (typeof refreshToken == 'undefined' || refreshToken == '') {
    res.status(440).send(new Error440('ERR_440_USERS_0101', 'Input value error.'));
    return;
  }

  if(commonJs.sqlInjection(refreshToken)){
    res.status(440).send(new Error440('ERR_440_INPUT_0101', 'Input value error.'));
    return;
  }

  loginService.refreshAccessToken(refreshToken)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.post('/signup', function(req, res) {
  const emailAddr = req.body.emailAddr;
  const password = req.body.password;
  const surname = req.body.surname;
  const givenname = req.body.givenname;

  signupService.signUp(givenname, surname, emailAddr, password)
  .then(data => {
    console.log(data);
    res.status(200).send({resStatus : data});
  })
  .catch (err => {
    res.status(err.status).send(err);
  });
});

router.post('/sendActivationMail', function(req, res) {
  const emailAddr = req.body.emailAddr;

  signupService.sendActivationMail(emailAddr)
  .then(data => {
    console.log(data);
    res.status(200).send(data);
  })
  .catch (err => {
    res.status(err.status).send(err);
  });
});

router.post('/activation', function(req, res) {
  const activationToken = req.body.activationToken;

  signupService.activation(activationToken)
  .then(data => {
    console.log(data);
    res.status(200).send(data);
  })
  .catch (err => {
    res.status(err.status).send(err);
  });
});

router.post('/findPw', function(req, res){
  if(commonJs.reqInjection(req)){    
    res.status(440).send(new Error440('ERR_440_INPUT_0101', 'Input value error.'));  
    return;
  }

  const emailAddr = req.body.emailAddr;
  const langCd = req.body.langCd;
  if (typeof emailAddr == 'undefined' || emailAddr == '' ||
      typeof langCd == 'undefined' || langCd == '' ) {
    res.status(440).send(new Error440('ERR_440_USERS_0106', 'Input value error.'));
    return;
  } 
  const param = {
    emailAddr : emailAddr,
    langCd : langCd
  };

  mmbrpswdService.findPwSendEmail(emailAddr)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.post('/forgetChgPw', forgotPwTokenVerify, function(req, res){
  const emailAddr = req.decodedToken.email;
  const pwd = req.body.password;
  const accessIp = commonJs.getClientIp(req);
  
  if (typeof emailAddr == 'undefined' || emailAddr == '' ||
      typeof pwd == 'undefined' || pwd == '' ) {
    res.status(440).send(new Error440('ERR_440_USERS_0107', 'Input value error.'));  
    return;
  }

  if(commonJs.sqlInjection(emailAddr)){
    res.status(440).send(new Error440('ERR_440_INPUT_0101', 'Input value error.'));  
    return;
  }

  mmbrpswdService.changePassword(emailAddr, pwd, accessIp)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

module.exports = router;
