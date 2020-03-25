const express = require('express');
const router = express.Router();
const loginToken = require('../common/token/loginToken');
const Error440 = require('../common/error/Error440');
const Error540 = require('../common/error/Error540');
const commonJs = require('../common/common');
const svcWallet = require('../services/wallet/wallet');

router.get('/assets', loginToken, function(req, res){
  const mmbrId = req.decodedToken.mmbrId;

  // console.log(mmbrId);
  
  svcWallet.getMemberAssets(mmbrId)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

module.exports = router;