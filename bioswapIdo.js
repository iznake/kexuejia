//加载web3的库
const Web3 = require('web3');
require("dotenv").config();
//读取ERC20的ABI文件
const ifoAbi = require('./ABI/ifo.json');
const erc20Abi = require('./ABI/erc20.json');

//设置BSC的RPC链接
const rpcUrl = 'https://bsc-dataseed1.binance.org/';
const rpcWeb3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
let web3 = rpcWeb3;

const contractAddress = "0x3b53aA80dD213f430007Fa81995Aadf7EE1Bd4BA"
const tokenAddress = "0x965f527d9159dce6288a2219db51fc6eef120dd1";
/**
 * 查看是否有授权
 * @param {*} tokenAddress 代币的合约
 * @param {*} myAddress 钱包地址
 * @param {*} spender 给予授权的地址
 * @returns 是否授权
 */
 const hasApproved = async (tokenAddress, myAddress, spender) => {
    const tokenContract = new web3.eth.Contract(erc20Abi, tokenAddress);
    return (await tokenContract.methods.allowance(myAddress, spender).call()) > 0 ? true : false;
}

/**
 * 授权
 * @param {*} tokenAddress 代币的合约
 * @param {*} myAddress 钱包地址
 * @param {*} spender 给予授权的地址
 * @returns 授权结果
 */
const approve = (tokenAddress, myAddress, spender) => {
    return new Promise(async (resolve, reject) => {
        const tokenContract = new web3.eth.Contract(erc20Abi, tokenAddress);
        let maxAmount = web3.utils.toWei((Math.pow(2, 64) - 1).toString(), 'ether');
        let nounce = await web3.eth.getTransactionCount(myAddress);
        let data = await tokenContract.methods.approve(spender, maxAmount).encodeABI();
        let gasPrice = await web3.eth.getGasPrice();
        const gasLimit = 420000;
        let tx = {
            nounce,
            gasPrice,
            gasLimit,
            to: tokenAddress,
            value: web3.utils.toWei((0).toString(), 'Gwei'),
            data
        };
        web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY).then(signed => {
            web3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', receipt => {
                if (receipt.status) {
                    resolve(true);
                } else {
                    reject(false);
                }
            })
        });
    });
}

const depositToBasePool = async (myAddress) => {
    const contract = new web3.eth.Contract(ifoAbi, contractAddress);
    let nounce = await web3.eth.getTransactionCount(myAddress);
    // ifo info
    const amount = new web3.utils.toBN(51 * (10 ** 18));
    const pid = 0;
    let gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 420000;
    const data = contract.methods.depositPool(amount, pid).encodeABI();
    let tx = {
        nounce,
        gasPrice,
        gasLimit,
        to: contractAddress,
        value: web3.utils.toWei((0).toString(), 'Gwei'),
        data: data
    };
    web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY).then(signed => {
        web3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', console.log)
    });
};

async function main() {
    let account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    let isApprove = await hasApproved(tokenAddress,account.address,contractAddress);
    if(!isApprove){
        await approve(tokenAddress, account.address,contractAddress)
    }
    depositToBasePool(account.address);
}

main();