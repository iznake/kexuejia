const Web3 = require('web3');
require("dotenv").config();
const erc20Abi = require('./ABI/erc20.json');
const pancakeAbi = require('./ABI/pancake.json');
const rpcUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545';
const rpcWeb3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
const addresses = {
    WBNB: '0xae13d989dac2f0debff460ac112a837c89baa7cd',
    BUSD: '0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7',
    DAI: '0x8a9424745056eb399fd19a0ec26a14316684e274',
    PANCAKE_ROUTER: '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3',
    WBNB_BUSD_LP: '0xe0e92035077c39594793e61802a350347c320cf2',
    BUSD_DAI_LP: '0xF8E4ce287E0D1f9c9fda5EC917515cB87D9C1E6C'
}
let web3 = rpcWeb3;

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
        let symbol = await tokenContract.methods.symbol().call();
        resolve(`${tokenBalance} ${symbol}`);
    })

}

/**
 * 构建原生代币和ERC20代币数据
 * @param {*} toAddress 钱包地址
 * @param {*} tokenAmountOut 转出的数量
 * @param {*} tokendecimals 小数点位数
 * @returns 
 */
function swapTokenInput(toAddress, tokenAmountOut, tokendecimals = 18) {
    const weiname = getWeiName(tokendecimals);
    const path = [addresses.WBNB, addresses.BUSD];
    const amountOutMin = web3.utils.toWei(tokenAmountOut.toString(), weiname);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20
    const pancakeSwap = new web3.eth.Contract(pancakeAbi, addresses.PANCAKE_ROUTER);
    let data = pancakeSwap.methods.swapExactETHForTokens(web3.utils.toHex(amountOutMin), path, toAddress, deadline).encodeABI();
    return data;
}

/**
 * 构建ERC20代币和原生代币数据
 * @param {*} toAddress 钱包地址
 * @param {*} tokenamountIn 转入的数量
 * @param {*} tokenAmountOut 转出的数量
 * @param {*} tokendecimals 小数点位数
 * @returns 
 */
function tokensToEthInput(toAddress, tokenamountIn, tokenAmountOut, tokendecimals = 18) {
    const weiname = getWeiName(tokendecimals);
    const path = [addresses.BUSD, addresses.WBNB]
    const amountIn = web3.utils.toWei(tokenamountIn.toString(), weiname);
    const amountOutMin = web3.utils.toWei(tokenAmountOut.toString(), weiname);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const pancakeSwap = new web3.eth.Contract(pancakeAbi, addresses.PANCAKE_ROUTER);
    let data = pancakeSwap.methods.swapExactTokensForETH(web3.utils.toHex(amountIn), web3.utils.toHex(amountOutMin), path, toAddress, deadline).encodeABI();
    return data;
}

/**
 * 构建ERC20代币和ERC20代币数据
 * @param {*} toAddress 钱包地址
 * @param {*} tokenamountIn 转入的数量
 * @param {*} tokenAmountOut 转出的数量
 * @param {*} tokendecimals 小数点位数
 * @returns 
 */
function tokensToTokenInput(toAddress, tokenamountIn, tokenAmountOut, tokendecimals = 18) {
    const weiname = getWeiName(tokendecimals);
    const path = [addresses.BUSD, addresses.DAI]
    const amountIn = web3.utils.toWei(tokenamountIn.toString(), weiname);
    const amountOutMin = web3.utils.toWei(tokenAmountOut.toString(), weiname);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const pancakeSwap = new web3.eth.Contract(pancakeAbi, addresses.PANCAKE_ROUTER);
    let data = pancakeSwap.methods.swapExactTokensForTokens(web3.utils.toHex(amountIn), web3.utils.toHex(amountOutMin), path, toAddress, deadline).encodeABI();
    return data;
}

/**
 * 原生代币和ERC20代币交易
 * @param {*} myAddress 
 * @param {*} amount 
 * @param {*} rate 
 */
const swapBnbToToken = async (myAddress, amount, rate) => {
    const tokenContract = new web3.eth.Contract(erc20Abi, addresses.BUSD);
    const decimals = await tokenContract.methods.decimals().call();
    const los = 5;
    const ntoken = amount * (100 - los) / 100 * rate;
    let nounce = await web3.eth.getTransactionCount(myAddress);
    const nbnb = web3.utils.toWei((amount).toString(), 'ether');
    let gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 420000;
    const input = swapTokenInput(myAddress, ntoken.toFixed(18), decimals);
    let tx = {
        nounce,
        gasPrice,
        gasLimit,
        to: addresses.PANCAKE_ROUTER,
        value: nbnb,
        data: input
    };
    web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY).then(signed => {
        web3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', console.log)
    });
}

/**
 * ERC20代币和原生代币交易
 * @param {*} myAddress 钱包地址
 * @param {*} tokenToSell 要交易的合约
 * @param {*} rate 价格
 */
const swapTokenToBnb = async (myAddress, tokenToSell, rate) => {
    const tokenContract = new web3.eth.Contract(erc20Abi, addresses.BUSD);
    let isApproved = await hasApproved(addresses.BUSD, myAddress, addresses.PANCAKE_ROUTER);
    console.log(isApproved)
    if (!isApproved) {
        await approve(addresses.BUSD, myAddress, addresses.PANCAKE_ROUTER)
    }
    const decimals = await tokenContract.methods.decimals().call();
    const los = 5;
    const ntoken = tokenToSell * (100 - los) * 0.01 / rate;
    let nounce = await web3.eth.getTransactionCount(myAddress);
    let gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 420000;
    const input = tokensToEthInput(myAddress, tokenToSell, ntoken.toFixed(18), decimals);
    let tx = {
        nounce,
        gasPrice,
        gasLimit,
        to: addresses.PANCAKE_ROUTER,
        value: web3.utils.toWei((0).toString(), 'Gwei'),
        data: input
    };
    web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY).then(signed => {
        web3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', console.log)
    });
};
/**
 * ERC20 和 ERC20代币交易
 * @param {*} myAddress 钱包地址
 * @param {*} tokenToSell 要swap的代币
 * @param {*} rate 价格
 */
const swapTokenToToken = async (myAddress, tokenToSell, rate) => {
    const tokenContract = new web3.eth.Contract(erc20Abi, addresses.BUSD);
    let isApproved = await hasApproved(addresses.BUSD, myAddress, addresses.PANCAKE_ROUTER);
    if (!isApproved) {
        await approve(addresses.BUSD, myAddress, addresses.PANCAKE_ROUTER)
    }
    const decimals = await tokenContract.methods.decimals().call();
    const los = 5;
    const ntoken = tokenToSell * (100 - los) * 0.01 / rate;
    let nounce = await web3.eth.getTransactionCount(myAddress);
    let gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 420000;
    const input = tokensToTokenInput(myAddress, tokenToSell, ntoken.toFixed(18), decimals);
    let tx = {
        nounce,
        gasPrice,
        gasLimit,
        to: addresses.PANCAKE_ROUTER,
        value: web3.utils.toWei((0).toString(), 'Gwei'),
        data: input
    };
    web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY).then(signed => {
        web3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', console.log)
    });
};

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

//实现pancake的swap功能比如 ETHtotoken，tokentotoken，tokentoswap
async function main() {
    let account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    let bnbBsc = await getTokenBalance(addresses.WBNB, addresses.WBNB_BUSD_LP);
    let busdBsc = await getTokenBalance(addresses.BUSD, addresses.WBNB_BUSD_LP);
    let busdBnbRate = parseFloat(busdBsc) / parseFloat(bnbBsc);

    //BNB to Token Swap
    swapBnbToToken(account.address, 0.005, busdBnbRate);
    //Token to BNB Swap
    swapTokenToBnb(account.address, 1, busdBnbRate);

    let daiBsc = await getTokenBalance(addresses.DAI, addresses.BUSD_DAI_LP);
    busdBsc = await getTokenBalance(addresses.BUSD, addresses.BUSD_DAI_LP);
    let busdDaiRate = parseFloat(busdBsc) / parseFloat(daiBsc);
    //Token to Token Swap
    swapTokenToToken(account.address, 1, busdDaiRate);
}

main();