const Web3 = require('web3');
const erc20Abi = require('./ABI/erc20.json');
const factoryAbi = require('./ABI/factory.json');
const rpcUrl = 'https://bsc-dataseed.binance.org/';
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
const addresses = {
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
    DAI: '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
    PANCAKE_FACTORY: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73'
}

async function getPair(tokenA, tokenB) {
    let tokenContract = new web3.eth.Contract(factoryAbi, addresses.PANCAKE_FACTORY);
    let pair = await tokenContract.methods.getPair(tokenA, tokenB).call();
    return pair;
}
//通过小数点多少位，转换对应的数据
function getWeiName(tokenDecimals = 18) {
    tokenDecimals = Number(tokenDecimals);
    let weiName = 'ether';
    switch (tokenDecimals) {
        case 3:
            weiName = "Kwei";
            break;
        case 6:
            weiName = 'mwei';
            break;
        case 9:
            weiName = 'gwei';
            break;
        case 12:
            weiName = 'microether ';
            break;
        case 15:
            weiName = 'milliether';
            break;
        case 18:
            weiName = 'ether';
            break;
        default:
            weiName = 'ether';
            break;

    }
    return weiName;
}

/**
 * 获得ERC20代币余额
 * @param {*} tokenAddress 代币的合约
 * @param {*} address 钱包地址
 * @returns ERC20代币余额
 */
const getTokenBalance = (tokenAddress, address) => {
    return new Promise(async (resolve, reject) => {
        let tokenContract = new web3.eth.Contract(erc20Abi, tokenAddress);
        let result = await tokenContract.methods.balanceOf(address).call();
        let decimals = await tokenContract.methods.decimals().call();
        let weiName = getWeiName(decimals);
        let tokenBalance = web3.utils.fromWei(result, weiName);
        resolve(tokenBalance);
    })
}

async function main() {
    let BnbBusdLp = await getPair(addresses.WBNB, addresses.BUSD);
    let BusdPerBnb = await getTokenBalance(addresses.BUSD, BnbBusdLp) / await getTokenBalance(addresses.WBNB, BnbBusdLp);
    console.log("BNB price: $"+BusdPerBnb.toFixed(2))
    let BusdDaiLp = await getPair(addresses.BUSD, addresses.DAI);
    let DaiPerBusd = await getTokenBalance(addresses.DAI, BusdDaiLp) / await getTokenBalance(addresses.BUSD, BusdDaiLp);
    console.log("BUSD price: $"+DaiPerBusd.toFixed(2))
}

main();
