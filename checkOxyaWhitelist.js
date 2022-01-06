const fs = require('fs');
const ethAddressList = ["0xb5a895dd6f49af2997bc257b9ca5ce2ecaa3a787","0x475E5FbE12DA0C0b16EF7690172de84bdF75c105","0xbCe1330431b6639BB54184c2ca564aBDa991C9C2","0xe7BF57eE1402C68dB28dbcc1F43427CEd2C4218a","0xfc708D11Cf5b324bb21C29BB95644844228C1Def","0xd1b6F43d73d97b3BDC4a99357ABF4145ADFD70F7","0x3eA3aAB1eA2Dc26be63c91f8105EF1B2Eb093D57","0xe7BF57eE1402C68dB28dbcc1F43427CEd2C4218a","0xA4E2f15529b1d6FB410fAd1a64262BB2CA809211","0xc88370e40d7D958F5D8B2267DF4699120001908","0xfd619276Ee512c16db7358Dd055e56C2A85eFC65","0xe72D22B12Fcc10F58aa6439608ab9E8375B625eb","0x6F241e4d5ab1A133187d893EcACc07a14a5dA7D0","0x64084D818a908d809D0754DC09e32834c048342B","0x20997812aca9627C05456e93EA2e5De5Ec03eED2","0x5A7f915d2cD814ae7ACB39453A779320800B8c93","0x37dc4dcE95d281389C91AB47FC09B9F66BFeaF69"];

function getLines(filename) {
    if (!fs.existsSync(filename)) {
        writeEmails("");
        return [];
    } else {
        let list = fs.readFileSync(filename)
        let lines = list.toString().split(/\r?\n/)
        return lines;
    }
}

let keys = getLines("keys.txt");
for(let key of keys){
    let address = key.split(":")[0];
    if(ethAddressList.includes(address)){
        console.log(`${address} is whitelisted`);
    }
}
