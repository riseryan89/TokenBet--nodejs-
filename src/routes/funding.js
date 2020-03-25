const express = require('express');
const router = express.Router();
const loginToken = require('../common/token/loginToken');
const Error440 = require('../common/error/Error440');
const Error540 = require('../common/error/Error540');
const commonJs = require('../common/common');
const svcWallet = require('../services/wallet/wallet');
const svcExchangeChip = require('../services/wallet/exchangeChip');
const svcDeposit = require('../services/wallet/deposit');
const svcWithdrawal = require('../services/wallet/withdrawal');

router.get('/exchangeratio', function(req, res){
  // const mmbrId = req.decodedToken.mmbrId;
  
  svcExchangeChip.getExchangeRatio()
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.post('/buyAw', loginToken, function(req, res){
  const mmbrId = req.decodedToken.mmbrId;
  const {awAmount, coinCode} = req.body;
  
  if (awAmount === undefined || coinCode === undefined) {
    res.status(440).send(new Error440('ERR440_INVALID_PARAMETER'));
    return;
  }

  const illegalString = commonJs.findIllegalString([awAmount, coinCode]);
  if (illegalString !== '') {
    res.status(440).send(new Error440('ERR_440_ILLEGAL_PARAMS_0101', `illegal parameter: ${illegalString}`));
    return;
  }

  svcExchangeChip.buyAw(mmbrId, awAmount, coinCode)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.post('/sellAw', loginToken, function(req, res){
  const mmbrId = req.decodedToken.mmbrId;
  const {awAmount, coinCode} = req.body;
  
  if (awAmount === undefined || coinCode === undefined) {
    res.status(440).send(new Error440('ERR440_INVALID_PARAMETER'));
    return;
  }

  const illegalString = commonJs.findIllegalString([awAmount, coinCode]);
  if (illegalString !== '') {
    res.status(440).send(new Error440('ERR_440_ILLEGAL_PARAMS_0101', `illegal parameter: ${illegalString}`));
    return;
  }
  
  svcExchangeChip.sellAw(mmbrId, awAmount, coinCode)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.get('/history', loginToken, function(req, res) {
  const mmbrId = req.decodedToken.mmbrId;

  svcWallet.getFundingHistory(mmbrId)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.get('/deposit/address/:coinCode', loginToken, function(req, res) {
  const mmbrId = req.decodedToken.mmbrId;
  const { coinCode } = req.params;
  
  if (coinCode === undefined) {
    res.status(440).send(new Error440('ERR440_INVALID_PARAMETER'));
    return;
  }

  const illegalString = commonJs.findIllegalString([coinCode]);
  if (illegalString !== '') {
    res.status(440).send(new Error440('ERR_440_ILLEGAL_PARAMS_0101', `illegal parameter: ${illegalString}`));
    return;
  }

  svcDeposit.getDepsositAddress(Number(mmbrId), coinCode.toLowerCase())
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.get('/withdrawal/rule', function(req, res) {
  svcWithdrawal.getCoinInfo()
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.get('/withdrawal/available', loginToken, function(req, res) {
  const mmbrId = req.decodedToken.mmbrId;
  const { coinCode } = req.query;
  
  if (coinCode === undefined) {
    res.status(440).send(new Error440('ERR440_INVALID_PARAMETER'));
    return;
  }

  const illegalString = commonJs.findIllegalString([coinCode]);
  if (illegalString !== '') {
    res.status(440).send(new Error440('ERR_440_ILLEGAL_PARAMS_0101', `illegal parameter: ${illegalString}`));
    return;
  }

  svcWithdrawal.getAvailable(mmbrId, coinCode)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.post('/withdrawal', loginToken, function(req, res) {
  const mmbrId = req.decodedToken.mmbrId;

  const { coinCode, amount, address, password, veriCode } = req.body;
  
  if (coinCode === undefined || amount === undefined || address === undefined || password === undefined || veriCode === undefined) {
    res.status(440).send(new Error440('ERR440_INVALID_PARAMETER'));
    return;
  }

  const illegalString = commonJs.findIllegalString([coinCode]);
  if (illegalString !== '') {
    res.status(440).send(new Error440('ERR_440_ILLEGAL_PARAMS_0101', `illegal parameter: ${illegalString}`));
    return;
  }

  svcWithdrawal.withdrawal(mmbrId, coinCode, amount, address, password, veriCode)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

module.exports = router;