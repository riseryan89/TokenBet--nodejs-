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

const sendMail = (recvEmailAddr, lang) => {
  var mailSubject = '[Arenawave.io] Your Password has been changed.';
    
  let filename = './mailhtmlbody/' + 'password_change_complete.html';
  let mailbodyhtml = getMailBody(filename);
  
  mailbodyhtml = mailbodyhtml.replace("{{Date}}", new Date().toUTCString());
  
  var data = {
    from: mailerInfo.senderAddr,
    to: recvEmailAddr,
    subject: mailSubject,
    html: mailbodyhtml,
  };
  
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
