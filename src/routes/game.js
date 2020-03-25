const express = require('express');
const router = express.Router();
const loginToken = require('../common/token/loginToken');
const Error440 = require('../common/error/Error440');
const commonJs = require('../common/common');
const gameServices = require('../services/game');

router.get('/nextgames', function(req, res){
  gameServices.gameInfo.getNextGamesStatus()
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.post('/bet', loginToken, function(req, res){
  const mmbrId = req.decodedToken.mmbrId;

  const { gameId, betType, amount } = req.body;

  if (gameId === undefined || betType === undefined || amount === undefined) {
    res.status(440).send(new Error440('ERR440_INVALID_PARAMETER'));
    return;
  }

  const illegalString = commonJs.findIllegalString([gameId, betType]);
  if (illegalString !== '') {
    res.status(440).send(new Error440('ERR_440_ILLEGAL_PARAMS_0101', `illegal parameter: ${illegalString}`));
    return;
  }
  
  gameServices.betting.bet(mmbrId, gameId, betType, amount)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.get('/myopenbet', loginToken, function(req, res){
  const mmbrId = req.decodedToken.mmbrId;

  gameServices.betting.getMyOpenBettingList(mmbrId)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.delete('/myopenbet/cancel', loginToken, function(req, res){
  const mmbrId = req.decodedToken.mmbrId;
  
  const { type, amount, time, gameId, openTime } = req.query;
  console.log('router.delete', type, amount, time, gameId, openTime);

  if (type === undefined || amount === undefined || time === undefined || gameId === undefined || openTime === undefined) {
    res.status(440).send(new Error440('ERR440_INVALID_PARAMETER'));
    return;
  }

  const illegalString = commonJs.findIllegalString([type, amount, time, gameId, openTime]);
  if (illegalString !== '') {
    res.status(440).send(new Error440('ERR_440_ILLEGAL_PARAMS_0101', `illegal parameter: ${illegalString}`));
    return;
  }

  gameServices.betting.cancel(mmbrId, type, amount, time, gameId, openTime)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.get('/myrecentresult', loginToken, function(req, res) {
  const mmbrId = req.decodedToken.mmbrId;
  const { fromTime } = req.query;

  if (fromTime === undefined) {
    res.status(440).send(new Error440('ERR440_INVALID_PARAMETER'));
    return;
  }

  const illegalString = commonJs.findIllegalString([fromTime]);
  if (illegalString !== '') {
    res.status(440).send(new Error440('ERR_440_ILLEGAL_PARAMS_0101', `illegal parameter: ${illegalString}`));
    return;
  }

  gameServices.betting.getMyRecentResultList(mmbrId, fromTime)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.get('/mygameresulthistory', loginToken, function(req, res) {
  const mmbrId = req.decodedToken.mmbrId;
  const { fromTime, toTime } = req.query;

  const illegalString = commonJs.findIllegalString([fromTime, toTime]);
  if (illegalString !== '') {
    res.status(440).send(new Error440('ERR_440_ILLEGAL_PARAMS_0101', `illegal parameter: ${illegalString}`));
    return;
  }

  gameServices.betting.getMyGameResultHistory(mmbrId, Number(fromTime), Number(toTime))
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

router.get('/cancelcodes', function(req, res){
  gameServices.gameInfo.getGameCancelCodes()
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

module.exports = router;