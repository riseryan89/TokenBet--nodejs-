const fs = require('fs');
const axios = require('axios');
const { Error440, Error540 } = require('../../common/error');

var cfgHostName = JSON.parse(fs.readFileSync('/var/aw_system/web_conf/webapp/serviceHostName.json', 'utf8'));

const getDepsositAddress = (mmbrId, coinCode) => new Promise(async(resolve, reject) => {
  try {
    const endpointFunding = cfgHostName.aw_funding;
    const addr = `${endpointFunding.host}:${endpointFunding.port}/wallet/${coinCode}`;
    const params = { mmbr_id:mmbrId };

    const result = await axios.post(addr, null, { params });
    // console.log(result.data);
    resolve({ address: result.data.message});
  } catch (error) {
    console.error(error);
    reject(error);
  }
});

module.exports = {
  getDepsositAddress,
};
