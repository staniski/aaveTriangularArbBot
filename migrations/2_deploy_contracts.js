let Flashloan = artifacts.require("Flashloan")

module.exports = async function (deployer, network) {
    try {

        let lendingPoolAddressesProviderAddress;
        let uniswapAddress;
        let kyberAddress;

        switch(network) {
            case "mainnet":
            case "mainnet-fork":
            case "development": // For Ganache mainnet forks
                lendingPoolAddressesProviderAddress = "0x24a42fD28C976A61Df5D00D0599C34c4f90748c8"; 
                uniswapAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
                kyberAddress = "0x9AAb3f75489902f3a48495025729a0AF77d4b11e";break
                

            case "ropsten":
            case "ropsten-fork":
                lendingPoolAddressesProviderAddress = "0x1c8756FD2B28e9426CDBDcC7E3c4d64fa9A54728"; break
            case "kovan":
            case "kovan-fork":
                lendingPoolAddressesProviderAddress = "0x506B0B2CF20FAA8f38a4E2B524EE43e1f4458Cc5";
                uniswapAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
                kyberAddress = '0xc153eeAD19e0DBbDb3462Dcc2B703cC6D738A37c'; break
            default:
                throw Error(`Are you deploying to the correct network? (network selected: ${network})`)
        }

        await deployer.deploy(Flashloan, lendingPoolAddressesProviderAddress,uniswapAddress,kyberAddress)
    } catch (e) {
        console.log(`Error in migration: ${e.message}`)
    }
}