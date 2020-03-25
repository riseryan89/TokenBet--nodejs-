var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var tokenInfo = require('../../../conf/tokenInfo'); // get our tokenInfo file
const ErrorXXX = require('../error/ErrorXXX');
  
function loginToken(req, res, next) {
  let headerName = 'authorization';
  let tokenType = 'bearer ';

  // console.log(req.headers);
  // console.log(req.headers.authorization);
  // console.log(req.headers['authorization']);

  // check header or url parameters or post parameters for token
  var tokenValue = req.headers[headerName];
  if (!tokenValue){
    return res.status(434).send(new ErrorXXX(434, 'ERR_434_LI_TOKEN_0101', 'Invalid token.'));
  } 
  if (!tokenValue.startsWith(tokenType)){
    return res.status(434).send(new ErrorXXX(434, 'ERR_434_LI_TOKEN_0102', 'Invalid token.'));
  }

  let token = tokenValue.substring(tokenType.length);

  // console.log(token);
  // verifies secret and checks exp
  jwt.verify(token, tokenInfo.access.jwtSecret, function(err, decoded) {
    // console.log(decoded);
    if (err) {
      if(err.name === 'TokenExpiredError') {
        return res.status(434).send(new ErrorXXX(434, 'ERR_434_LI_TOKEN_VERI_01', 'Token expired.'));
      } else {
        return res.status(434).send(new ErrorXXX(434, 'ERR_434_LI_TOKEN_VERI_02', 'Invalid token.'));
      }
    }

    // if everything is good, save to request for use in other routes
    req.decodedToken = decoded;
    next();
  });
}

module.exports = loginToken;