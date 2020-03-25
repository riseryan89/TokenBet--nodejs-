const express = require('express');
const bodyParser = require('body-parser');

const usersRouter = require('./src/routes/users');
const mypageRouter = require('./src/routes/mypage');
const walletRouter = require('./src/routes/wallet');
const fundingRouter = require('./src/routes/funding');
const gameRouter = require('./src/routes/game');
const chartRouter = require('./src/routes/chart');

global.basePath = __dirname;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use('/api/users', usersRouter);
app.use('/api/mypage', mypageRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/funding', fundingRouter);
app.use('/api/game', gameRouter);
app.use('/api/chart', chartRouter);

app.use('/api/servertime', (req, res) => {
  const servertime = new Date().getTime();
  res.status(200).send({servertime});
});

app.listen(39980, function() {
  console.log('start');
});
