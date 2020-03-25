const jwt = require('jsonwebtoken');

const jwtVerify = (tokenString, secret) => new Promise(async(resolve, reject) => {
  jwt.verify(tokenString, secret, function(err, decoded) {
    if (err) {
      reject(err);
    } else {
      resolve(decoded);
    }
  });
});

module.exports = {
  jwtVerify
};
