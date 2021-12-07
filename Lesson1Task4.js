//加载web3的库
const Web3 = require('web3');
const rpcUrls = ['https://bsc-dataseed1.binance.org/', 'https://rpcapi.fantom.network', 'https://polygon-rpc.com'];



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
 * 获得代币的符号
 * @param {*} chainId 网络ID
 * @returns 代币的符号
 */
function getChainToken(chainId) {
    let token = '';
    switch (chainId) {
        case 56:
            token = 'BNB';
            break;
        case 137:
            token = 'FTM';
            break;
        case 250:
            token = 'MATIC';
            break;
        default:
            token = 'ETH';
            break;
    }
    return token;
}

/**
 * 获得钱包原生代币数量
 * address: 钱包地址
**/
const getEthBalance = async (address, web3) => {
    let result = await web3.eth.getBalance(address);
    if (result) {
        //经过小数点转换之后的ETH数量
        let balance = web3.utils.fromWei(result, getWeiName());
        let chainId = await web3.eth.getChainId();
        let token = getChainToken(chainId);
        return `你的钱包里有：${balance} ${token}`;
    } else {
        console.error("Getting ETH Balance error.");
    }
}

//查看多个链钱包余额
async function main() {
    let myWallet = '0x11e78fC4B70014d7B8978287bA3c5103D80dDd06';
    for (let rpc of rpcUrls) {
        let rpcWeb3 = new Web3(new Web3.providers.HttpProvider(rpc));
        let web3 = rpcWeb3;
        let balance = await getEthBalance(myWallet, web3);
        console.log(balance)
    }
}

main()