var Web3 = require('web3');
const fs = require('fs');
const axios = require('axios');
var web3 = new Web3('https://eth-mainnet.alchemyapi.io/v2/drsYFmqbDqcTNhWsrceiuHE4x_Zmzlb7');
const msg = "I participate to Oxya Orgin raffle"
start();
setInterval(function(){
    start();
},15*1000);

async function start() {
    let wallet = web3.eth.accounts.create();
    const { signature } = await web3.eth.accounts.sign(msg, wallet.privateKey);
    axios.post(`https://api.oxyaorigin.com/wallet/register`,{
        signature
    })
    .then(res=>{
        if(res.data.success=='true'){
            console.log(`${wallet.address} joined the whitelist raffle.`);
        }
        writeOutput(`${wallet.address}:${wallet.privateKey}\n`);
    }).catch(err=>{
        console.log(err)
    })

}

function writeOutput(data) {
    fs.appendFile('keys.txt', data, function (err) {
        if (err) throw err;
    });
}