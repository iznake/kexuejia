//加载web3的库
const Web3 = require('web3');
//读取ERC20的ABI文件
const erc20Abi = require('./ABI/erc20.json');
//设置BSC的RPC链接
const rpcUrl = 'https://bsc-dataseed1.binance.org/';
const rpcWeb3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

let web3 = rpcWeb3;

/**
 * 通过小数点多少位，转换对应的数据
 * tokenDecimals: 代币的小数点数
 * 
**/
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
 * 获得钱包BNB数量
 * address: 钱包地址
**/
const getBnbBalance = async (address) => {
    let result = await web3.eth.getBalance(address);
    if (result) {
        //经过小数点转换之后的BNB数量
        let balance = web3.utils.fromWei(result, getWeiName());
        return balance;
    } else {
        console.error("Getting Bnb Balance error.");
    }
}

/**
 * 获得钱包代币数量
 * tokenAddress: 代币合约地址
 * address: 钱包地址
**/
const getTokenBalance = async (tokenAddress, address) => {
    ////创建代币的智能合约函数
    let tokenContract = new web3.eth.Contract(erc20Abi, tokenAddress);
    //调用代币的智能合约获取余额功能
    let result = await tokenContract.methods.balanceOf(address).call();
    //获得代币有多少位小数
    let decimals = await tokenContract.methods.decimals().call();
    let weiName = getWeiName(decimals);
    let tokenBalance = web3.utils.fromWei(result, weiName);
    //获得代币的符号
    let symbol = await tokenContract.methods.symbol().call();
    return `${tokenBalance} ${symbol}`;
}

/**
 * 读取钱包里的10个代币的数量
**/
async function main() {
    let myWallet = '0x11e78fC4B70014d7B8978287bA3c5103D80dDd06';
    let walletBalance = await getBnbBalance(myWallet);
    console.log(`地址: ${myWallet} 有 ${walletBalance} BNB`);
    let tokens = [];
    tokens.push('0x55d398326f99059ff775485246999027b3197955');
    tokens.push('0x3fda9383a84c05ec8f7630fe10adf1fac13241cc');
    tokens.push('0x42712df5009c20fee340b245b510c0395896cf6e');
    tokens.push('0x373233A38ae21cF0C4f9DE11570E7D5Aa6824A1E');
    tokens.push('0x04645027122c9f152011f128c7085449b27cb6d7');
    tokens.push('0x740b40760266d54362c222c0490a95cf970cd199');
    tokens.push('0x7c357cd85bb600f748ec1d82adef74464c13e7a7');
    tokens.push('0xf0d585a29a86c25819526ba494100951dc31aa0b');
    tokens.push('0x366945ba85881b77c186597b4639683efeeb65ca');
    tokens.push('0xfb9f5738c9d767fea5af6e4d826ce18d1a48589a');
    for (let token of tokens) {
        let balance = await getTokenBalance(token, myWallet);
        console.log(`地址: ${myWallet} 有 ${balance}`);
    }
}

//启动程序
main();