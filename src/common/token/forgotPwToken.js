var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var tokenInfo = require('../../../conf/tokenInfo'); // get our tokenInfo file
const Error440 = require('../error/Error440');
const ErrorXXX = require('../error/ErrorXXX');
  
function forgotPwToken(req, res, next) {
  let headerName = 'forgotpwkey';
  let tokenType = 'bearer ';

  // console.log(req.headers);
  // console.log(req.headers.authorization);
  // console.log(req.headers['authorization']);

  // check header or url parameters or post parameters for token
  var tokenValue = req.headers[headerName];
  if (!tokenValue){
    return res.status(434).send(new ErrorXXX(434, 'ERR_440_FP_TOKEN_0101', 'Invalid token.'));
  } 
  if (!tokenValue.startsWith(tokenType)){
    return res.status(434).send(new ErrorXXX(434, 'ERR_440_FP_TOKEN_0102', 'Invalid token.'));
  }

  let token = tokenValue.substring(7);

  // console.log(token);
  // verifies secret and checks exp
  jwt.verify(token, tokenInfo.forgotPw.jwtSecret, function(err, decoded) {
    if (err) {
      if(err.name === 'TokenExpiredError') {
        // console.error("TokenExpiredError  "+err.message);
        return res.status(434).send(new ErrorXXX(434, 'ERR_440_FP_TOKEN_E_0101', 'Token expired.'));
      } else {
        console.error(err.message);
        return res.status(434).send(new ErrorXXX(434, 'ERR_440_FP_TOKEN_0103', 'Invalid token.'));
      }
    }

    // if everything is good, save to request for use in other routes
    req.decodedToken = decoded;
    next();
  });
}

module.exports = forgotPwToken;
