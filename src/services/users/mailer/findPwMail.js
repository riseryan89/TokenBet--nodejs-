'use strict';
const mailProperty = require('/var/aw_system/web_conf/webapp/mailProperty');
const mailerInfo = require('../../../../conf/mailer');

var getMailBody = function(fileName) {
  var fs = require('fs');
  require.extensions['.html'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
  };
  var word = require(fileName);
  return word;
};

const sendMail = (recvEmailAddr, lang, tokenString) => {
  var mailSubject = '[Arenawave.io]Please confirm your email to change your password';
  
  let filename = './mailhtmlbody/' + 'password_change.html';
  let mailbodyhtml = getMailBody(filename);
  
  let confirmUrl = mailProperty.findPw.baseurl + mailProperty.findPw.confirmUri + tokenString;
  
  mailbodyhtml = mailbodyhtml.replace("{{Validation.Link.Address}}", confirmUrl);
  
  var data = {
    from: mailerInfo.senderAddr,
    to: recvEmailAddr,
    subject: mailSubject,
    html: mailbodyhtml,
  };
  // console.log(data);
  var mailgun = require('mailgun-js')({apiKey: mailerInfo.api_key, domain: mailerInfo.domain});
  mailgun.messages().send(data, function (error, body) {
    if (error) {
      console.error(error);
    } else {
      console.log(body);
    }
  });
};

module.exports.sendMail = sendMail;
