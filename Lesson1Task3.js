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


function swapTokenInput(toAddress, tokenAmountOut, tokendecimals = 18) {
    const weiname = getWeiName(tokendecimals);
    const path = [addresses.WBNB, addresses.BUSD];
    const amountOutMin = web3.utils.toWei(tokenAmountOut.toString(), weiname);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20
    const pancakeSwap = new web3.eth.Contract(pancakeAbi, addresses.PANCAKE_ROUTER);
    let data = pancakeSwap.methods.swapExactETHForTokens(web3.utils.toHex(amountOutMin), path, toAddress, deadline).encodeABI();
    return data;
}

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
const swapTokenToBnb = async (myAddress, tokenToSell, rate) => {
    const tokenContract = new web3.eth.Contract(erc20Abi, addresses.BUSD);
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
const swapTokenToToken = async (myAddress, tokenToSell, rate) => {
    const tokenContract = new web3.eth.Contract(erc20Abi, addresses.BUSD);
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

//实现pancake的swap功能比如 ETHtotoken，tokentotoken，tokentoswap
async function main() {
    let bnbBsc = await getTokenBalance(addresses.WBNB, addresses.WBNB_BUSD_LP);
    let busdBsc = await getTokenBalance(addresses.BUSD, addresses.WBNB_BUSD_LP);
    let busdBnbRate = parseFloat(busdBsc) / parseFloat(bnbBsc);
    //BNB to Token Swap
    swapBnbToToken('0xFAa8dF66E9C83304210b48BdABc951Cf75c35905', 0.005, busdBnbRate);
    //Token to BNB Swap
    swapTokenToBnb('0xFAa8dF66E9C83304210b48BdABc951Cf75c35905', 1, busdBnbRate);

    let daiBsc = await getTokenBalance(addresses.DAI, addresses.BUSD_DAI_LP);
    busdBsc = await getTokenBalance(addresses.BUSD, addresses.BUSD_DAI_LP);
    let busdDaiRate = parseFloat(busdBsc) / parseFloat(daiBsc);
    //Token to Token Swap
    swapTokenToToken('0xFAa8dF66E9C83304210b48BdABc951Cf75c35905', 1, busdDaiRate);
}

main();