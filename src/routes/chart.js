const express = require('express');
const router = express.Router();
const Error440 = require('../common/error/Error440');
const Error540 = require('../common/error/Error540');
const commonJs = require('../common/common');
const svcChart = require('../services/chart');

router.get('/', function(req, res){
  const { gameId, fromTime, intervalSec } = req.query;
  // console.log({ gameId, fromTime, function:'chart.router.get' });
  if (gameId === undefined || fromTime === undefined || intervalSec === undefined) {
    res.status(440).send(new Error440('ERR440_INVALID_PARAMETER'));
    return;
  }

  const illegalString = commonJs.findIllegalString([gameId, fromTime, intervalSec]);
  if (illegalString !== '') {
    res.status(440).send(new Error440('ERR_440_ILLEGAL_PARAMS_0101', `illegal parameter: ${illegalString}`));
    return;
  }
  
  svcChart.chartData.getChartData(gameId, fromTime, intervalSec)
  .then(data => res.status(200).send(data))
  .catch(err => res.status(err.status).send(err));
});

module.exports = router;