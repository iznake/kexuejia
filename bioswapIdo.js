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
const approve = (tokenAddress, myAddress, spender, depositAmount) => {
    return new Promise(async (resolve, reject) => {
        const tokenContract = new web3.eth.Contract(erc20Abi, tokenAddress);
        let maxAmount = web3.utils.toWei(depositAmount.toString(), 'ether');
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
                    console.log("Contract Approved");
                    resolve(true);
                } else {
                    console.log("Contract not approved");
                    reject(false);
                }
            })
        });
    });
}

const depositToPool = async (myAddress, pid, depositAmount) => {
    const contract = new web3.eth.Contract(ifoAbi, contractAddress);
    let nounce = await web3.eth.getTransactionCount(myAddress);
    // ifo info
    const amount = new web3.utils.toBN(depositAmount * (10 ** 18));
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
        web3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', receipt => {
            if (receipt.status) {
                console.log("成功存入");
            } else {
                console.log(receipt);
            }
        })
    });
};

const harvestPool = async (myAddress, pid) => {
    const contract = new web3.eth.Contract(ifoAbi, contractAddress);
    let nounce = await web3.eth.getTransactionCount(myAddress);
    let gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 420000;
    const data = contract.methods.harvestPool(pid).encodeABI();
    let tx = {
        nounce,
        gasPrice,
        gasLimit,
        to: contractAddress,
        value: web3.utils.toWei((0).toString(), 'Gwei'),
        data: data
    };
    web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY).then(signed => {
        web3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', receipt => {
            if (receipt.status) {
                console.log("收菜成功");
            } else {
                console.log(receipt);
            }
        })
    });
};

async function getEndBlock() {
    const contract = new web3.eth.Contract(ifoAbi, contractAddress);
    let endBlock = await contract.methods.endBlock().call();
    return endBlock;
}
async function getStartBlock() {
    const contract = new web3.eth.Contract(ifoAbi, contractAddress);
    let endBlock = await contract.methods.startBlock().call();
    return endBlock;
}

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function main() {
    let account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    const depositAmount = 57; //存入池子的币的数量 基础池子最多$100 无限池子任意
    const pid = 0;//0: 基础池子 1: 无限池子
    let currentBlock = await web3.eth.getBlockNumber();
    let startBlock = await getStartBlock();
    let endBlock = await getEndBlock();
    console.log(`IFO在第${startBlock}区块开始`)
    while (currentBlock < startBlock) {
        let diff = startBlock - currentBlock;
        console.log(`还差${diff}块IFO才开始`);
        currentBlock = await web3.eth.getBlockNumber();
        await sleep(5000);

    }
    let isApprove = await hasApproved(tokenAddress, account.address, contractAddress);
    if (!isApprove) {
        await approve(tokenAddress, account.address, contractAddress, depositAmount);
    }
    // 存入币参与IFO
    console.log("正在存入币...");
    depositToPool(account.address, pid, depositAmount);

    while (currentBlock < endBlock) {
        let diff = endBlock - currentBlock;
        console.log(`还差${diff}块才能领取IFO币`);
        currentBlock = await web3.eth.getBlockNumber();
        await sleep(5000);

    }
    console.log("正在领取IFO币")
    //收菜
    harvestPool(account.address, pid);
}

main();