'use strict';
const speakeasy = require('speakeasy');

const getToLocaleString = function(dttm) {
  
  dttm = new Date(parseInt(dttm));
  dttm = dttm.toLocaleString();
 
  return dttm;
};

const chdDecimal = function(value){ 
    'use strict';
    let split4Num = '-';
    let innerValue = value.toString();
      if(innerValue.indexOf(split4Num) != -1){
         let ieArray = innerValue.split(split4Num);
         return Number(innerValue).toFixed(Math.abs(Number(ieArray[1]))); 
     } else{ 
         return value;
     }
};

const checkNum = function(value){ 
    const regNumber = /^[0-9]*$/;
    if(!regNumber.test(value)){
      return true;
    } else {
      return false;
    }
};

// allow nubmer and only one dot
const checkNumAcptDot = function(value){ 
    const regNumber = /^[0-9.]*$/;
    const checkValue = (value.match(/\./g) || []).length;
    if(!regNumber.test(value)){
      return true;
    } else if(value.startsWith('\.')){
      return true;
    } else if(checkValue > 1){
      return true;
    } else {
      return false;
    }
};

const checkNull = function(value){ 
    if (value === '' || value === null || value === undefined || (value !== null && typeof value === 'object' && ! Object.keys(value).length) || value === 'undefine' || value === 'undefined') {
      return true;
    } else {
      return false;
    }
};

const reqInjection = function(value){      
  if(sqlInjection(value.query) || sqlInjection(value.body)){       
    return true;
  } 
  return false;   
};

const sqlInjection = function(value,isArr){ 
  if(isArr){
    for(let i =0; i<value.length; i++){
      value[i] = JSON.stringify(value).toString();      
      value[i] = value[i].replace(/ /gi, "");  // remove white spaces before beginning
      let pettern1 = /[;#]/gi;  
      let pettern2 = /--/gi;  
      let pettern3 = /\/\*/gi;
      let pettern4 = /\*\//gi;  
      if(pettern1.test(value[i])){    
        return true;
      }else if(pettern2.test(value[i])){    
        return true;
      }else if(pettern3.test(value[i])){    
        return true;
      }else if(pettern4.test(value[i])){    
        return true;
      }
    }
    return false;
  }else {
    value = JSON.stringify(value).toString();      
    value = value.replace(/ /gi, "");  // remove white spaces before beginning
    let pettern1 = /[;#]/gi;  
    let pettern2 = /--/gi;  
    let pettern3 = /\/\*/gi;
    let pettern4 = /\*\//gi;  
    if(pettern1.test(value)){    
      return true;
    }else if(pettern2.test(value)){    
      return true;
    }else if(pettern3.test(value)){    
      return true;
    }else if(pettern4.test(value)){    
      return true;
    }
    return false;
  }
};

const getClientIp = function(req){ // Client IP fixed
  let clientIp = req.headers['x-forwarded-for'];
  
  if(!checkNull(clientIp)){
    if(clientIp.indexOf(',') > 0) {
      // The general format of the field is: X-Forwarded-For: client, proxy1, proxy2, ... the left-most being the original client,
      // https://en.m.wikipedia.org/wiki/X-Forwarded-For
      clientIp = clientIp.split(",")[0];
    }
  }
  return clientIp || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
};

function findIllegalString(arrString) {
  for(let str of arrString) {
    if (typeof str == 'undefined') {
      continue;
    }
    if (typeof str != 'string') return str;
    if (str.indexOf('\'') > 0) return str;
    if (str.indexOf('--') > 0) return str;
    if (str.indexOf('#') > 0) return str;
    if (str.indexOf(';') > 0) return str;
  }
  return '';
}

const getCertiChar = function(){
  //이메일 활성문자 가져오기
  const randomChar = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let certiChar = '';
  for(let i=0; i < 10; i++) {
    certiChar += randomChar.charAt(Math.floor(Math.random() * randomChar.length));
  }
  certiChar = certiChar.toUpperCase();
  // console.log("이메일 활성화 문자  :::::   " + certiChar);
  return certiChar;
};

//verify OTP
function verifyOTP(certiNo, OTPCode, callback){
  const userToken = certiNo;   //유저 토큰 입력값을 가져온다
  const secret = OTPCode;      //해당 유저 OTP값
  const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: userToken
  });

  return callback(verified);
}

module.exports.getToLocaleString = getToLocaleString;
module.exports.chdDecimal = chdDecimal;
module.exports.checkNum = checkNum;
module.exports.checkNumAcptDot = checkNumAcptDot;
module.exports.checkNull = checkNull;
module.exports.reqInjection = reqInjection;
module.exports.sqlInjection = sqlInjection;
module.exports.findIllegalString = findIllegalString;
module.exports.getClientIp = getClientIp;
module.exports.getCertiChar = getCertiChar;
module.exports.verifyOTP = verifyOTP;
