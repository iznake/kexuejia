//加载web3的库
const Web3 = require('web3');
require("dotenv").config();
//读取ERC20的ABI文件
const erc20Abi = require('./ABI/erc20.json');
//设置BSC的RPC链接
const rpcUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545';
const rpcWeb3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
let web3 = rpcWeb3;

/**
 * 通过小数点多少位，转换对应的数据
 * @param {*} tokenDecimals 小数点位数
 * @returns 相对应的位数名
 */
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
 * 获得钱包原生代币余额
 * @param {*} address 钱包地址
 * @returns 钱包原生代币数量
 */
const getBnbBalance = (address) => {
    return new Promise(async (resolve, reject) => {
        let result = await web3.eth.getBalance(address);
        if (result) {
            let balance = web3.utils.fromWei(result, getWeiName());
            resolve(balance);
        } else {
            reject("Getting Bnb Balance error.");
        }
    })
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
        let symbol = await tokenContract.methods.symbol().call();
        resolve(`${tokenBalance} ${symbol}`);
    })

}

/**
 * 转移代币
 * @param {*} from 来源钱包
 * @param {*} to 目标钱包
 * @param {*} amount 数量
 * @param {*} input 构造的数据
 */
const transfer = async (from, to, amount, input) => {
    let gasPrice = await web3.eth.getGasPrice();
    let gasLimit = 420000;
    let nounce = await web3.eth.getTransactionCount(from);
    let nbnb = web3.utils.toWei((amount).toString(10), 'ether');
    let tx = {
        nounce,
        gasPrice,
        gasLimit,
        to,
        value: nbnb,
        data: input
    }
    web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY).then(signed => {
        web3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', console.log)
    })

}

/**
 * 转移ERC20代币
 */
async function transferErc20() {
    let account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    let from = account.address;
    let toWallet = "0xF5FD98884ba506B8F0a4afC856063f1fF42a30C9";
    let tokenAddress = '0xed24fc36d5ee211ea25a80239fb8c4cfd80f12ee';//BUSD
    let balance = await getTokenBalance(tokenAddress, from);
    let amount = 0.1;
    const tokenContract = new web3.eth.Contract(erc20Abi, tokenAddress);
    const input = tokenContract.methods.transfer(toWallet, web3.utils.toWei((amount).toString(), 'ether')).encodeABI();
    if (parseFloat(balance) > amount) {
        console.log(`Transferring ${amount} BUSD from ${from} to ${toWallet}.`)
        transfer(from, tokenAddress, 0, input);
    } else {
        console.log('Insufficient balance to transfer!');
    }
}

/**
 * 转移原生代币
 */
async function transferBnB() {
    let account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    let from = account.address;
    let balance = await getBnbBalance(from);
    let to = "0xF5FD98884ba506B8F0a4afC856063f1fF42a30C9";
    let amount = 0.01;
    if (balance > amount) {
        console.log(`Transferring ${amount} BNB from ${from} to ${to}.`)
        transfer(from, to, amount, '');
    } else {
        console.log('Insufficient balance to transfer!');
    }
}

//在源代码的基础上，调用代币的transfer功能转移代币（比如WBNB）
transferErc20();
transferBnB();