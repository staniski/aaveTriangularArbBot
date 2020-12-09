require('dotenv').config()
const axios = require('axios')
const _ = require('lodash')
const ethers = require('ethers')
const BN = ethers.BigNumber


const Flashloan = require("./build/contracts/Flashloan.json");
const IKyber = require("./build/contracts/IKyberNetworkProxy.json");
const { ChainId, Fetcher, TokenAmount, Pair, WETH, Route, TradeType, Trade, Percent, JSBI, Token } = require('@uniswap/sdk');




const provider = new ethers.providers.InfuraProvider("mainnet", {
  projectId: process.env.INFURA_PROJECT_ID,

});


let walletPK = `0x${process.env.DEPLOYMENT_ACCOUNT_KEY}`;
const wallet = new ethers.Wallet(walletPK, provider);
const flashloan = new ethers.Contract(
  'YOUR_CONTRACT',
  Flashloan.abi,
  wallet
)
const kyberswap = new ethers.Contract(

  "0x9AAb3f75489902f3a48495025729a0AF77d4b11e",
  [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"trader","type":"address"},{"indexed":false,"internalType":"contract IERC20","name":"src","type":"address"},{"indexed":false,"internalType":"contract IERC20","name":"dest","type":"address"},{"indexed":false,"internalType":"address","name":"destAddress","type":"address"},{"indexed":false,"internalType":"uint256","name":"actualSrcAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"actualDestAmount","type":"uint256"},{"indexed":false,"internalType":"address","name":"platformWallet","type":"address"},{"indexed":false,"internalType":"uint256","name":"platformFeeBps","type":"uint256"}],"name":"ExecuteTrade","type":"event"},{"inputs":[{"internalType":"contract ERC20","name":"src","type":"address"},{"internalType":"contract ERC20","name":"dest","type":"address"},{"internalType":"uint256","name":"srcQty","type":"uint256"}],"name":"getExpectedRate","outputs":[{"internalType":"uint256","name":"expectedRate","type":"uint256"},{"internalType":"uint256","name":"worstRate","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"src","type":"address"},{"internalType":"contract IERC20","name":"dest","type":"address"},{"internalType":"uint256","name":"srcQty","type":"uint256"},{"internalType":"uint256","name":"platformFeeBps","type":"uint256"},{"internalType":"bytes","name":"hint","type":"bytes"}],"name":"getExpectedRateAfterFee","outputs":[{"internalType":"uint256","name":"expectedRate","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"src","type":"address"},{"internalType":"uint256","name":"srcAmount","type":"uint256"},{"internalType":"contract IERC20","name":"dest","type":"address"},{"internalType":"address payable","name":"destAddress","type":"address"},{"internalType":"uint256","name":"maxDestAmount","type":"uint256"},{"internalType":"uint256","name":"minConversionRate","type":"uint256"},{"internalType":"address payable","name":"platformWallet","type":"address"}],"name":"trade","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"contract ERC20","name":"src","type":"address"},{"internalType":"uint256","name":"srcAmount","type":"uint256"},{"internalType":"contract ERC20","name":"dest","type":"address"},{"internalType":"address payable","name":"destAddress","type":"address"},{"internalType":"uint256","name":"maxDestAmount","type":"uint256"},{"internalType":"uint256","name":"minConversionRate","type":"uint256"},{"internalType":"address payable","name":"walletId","type":"address"},{"internalType":"bytes","name":"hint","type":"bytes"}],"name":"tradeWithHint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"src","type":"address"},{"internalType":"uint256","name":"srcAmount","type":"uint256"},{"internalType":"contract IERC20","name":"dest","type":"address"},{"internalType":"address payable","name":"destAddress","type":"address"},{"internalType":"uint256","name":"maxDestAmount","type":"uint256"},{"internalType":"uint256","name":"minConversionRate","type":"uint256"},{"internalType":"address payable","name":"platformWallet","type":"address"},{"internalType":"uint256","name":"platformFeeBps","type":"uint256"},{"internalType":"bytes","name":"hint","type":"bytes"}],"name":"tradeWithHintAndFee","outputs":[{"internalType":"uint256","name":"destAmount","type":"uint256"}],"stateMutability":"payable","type":"function"}],
  wallet

);


const chainId = ChainId.MAINNET;

const weth = WETH[chainId];


const eth = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

const dai = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

const usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const usdt = '0xdAC17F958D2ee523a2206206994597C13D831ec7'

const pairs = [
  [eth, usdt],
  [usdt, eth],
  [usdc, eth],
  [eth, usdc],
  [eth, dai],
  [dai, eth],
  [usdc, usdt],
  [usdt, usdc],
  [dai, usdc],
  [usdc, dai]
]
const paths = [
  
  [[eth, usdt], [usdt, usdc], [usdc, eth]],
  [[usdt, eth], [eth, usdc], [usdc, usdt]],
  [[usdc, eth], [eth, usdt], [usdt, usdc]],
  [[usdc, eth], [eth, dai], [dai, usdc]],
  [[eth, usdc], [usdc, usdt], [usdt, eth]],
  [[eth, usdc], [usdc, dai], [dai, eth]],
  [[eth, dai], [dai, usdc], [usdc, eth]],
  [[dai, eth], [eth, usdc], [usdc, dai]],
  [[usdc, usdt], [usdt, eth], [eth, usdc]],
  [[usdt, usdc], [usdc, eth], [eth, usdt]],
  [[dai, usdc], [usdc, eth], [eth, dai]],
  [[usdc, dai], [dai, eth], [eth, usdc]],
]

//checks perfomance for each pair
const perfomance = {}
let i = 0
let l = paths.length
for (i; i < l; i++) {
  perfomance[paths[i]] = 0
}
const USDC = new Token(chainId, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6)
const USDT = new Token(chainId, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6)
const DAI = new Token(chainId, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18)
const ETH = new Token(chainId, '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',18)

const tokens = {
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': USDC,
  '0xdAC17F958D2ee523a2206206994597C13D831ec7': USDT,
  '0x6B175474E89094C44Da98b954EedeAC495271d0F': DAI,
  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE': ETH,


}


/*

checks tokens decimals,
gets Uniswap expected exchange rates and slippage rate.
Also compares direct and multi paths
*/
async function getUniPriceTest(_from, _to, _amount) {

  const from = _from == eth ? weth : tokens[_from]
  const to = _to == eth ? weth : tokens[_to]
  let amountIn = 0
  const slippageTolerance = new Percent('50', '10000')
  if (_from === usdc || _from === usdt) {
    amountIn = ethers.utils.parseUnits(parseFloat(_amount).toFixed(6).toString(),"mwei")
    
  } else if (_from === wbtc) {
    amountIn = ethers.utils.parseUnits(parseFloat(_amount).toFixed(8).toString(),8)
    
  } else {
    amountIn = ethers.utils.parseEther(_amount.toString())
    
  }

  if (to == weth || from == weth) {
    const pair = await Fetcher.fetchPairData(from, to, provider)
    const route = new Route([pair], from)
    const trade = new Trade(route, new TokenAmount(from, amountIn), TradeType.EXACT_INPUT)
    const finalRate = trade.executionPrice.toFixed(6)
    const amountOutMin = BigInt(trade.minimumAmountOut(slippageTolerance).raw)
    const path = 2
    return { finalRate, amountOutMin, path }
    

  } else {
    const pair = await Fetcher.fetchPairData(from, to, provider)
    const pair1 = await Fetcher.fetchPairData(from, weth, provider)
    const pair2 = await Fetcher.fetchPairData(weth, to, provider)
    const route = new Route([pair], from)
    const routeMixed = new Route([pair1, pair2], from)
    const trade = new Trade(route, new TokenAmount(from, amountIn.toString()), TradeType.EXACT_INPUT)
    const tradeMix = new Trade(routeMixed, new TokenAmount(from, amountIn.toString()), TradeType.EXACT_INPUT)
    const rate = trade.executionPrice.toFixed(6)
    const rateMix = tradeMix.executionPrice.toFixed(6)
    const amountOutMin1 = BigInt(trade.minimumAmountOut(slippageTolerance).raw)
    
    const amountOutMin2 = BigInt(tradeMix.minimumAmountOut(slippageTolerance).raw)
    const finalRate = rate > rateMix ? rate : rateMix
    const amountOutMin = rate > rateMix ? amountOutMin1 : amountOutMin2
    const path = rate > rateMix ? 2 : 3
    return { finalRate, amountOutMin, path }
    
  }

}

/*

checks token decimals,
checks kyber exchange rate
returns a number and a BigNumber

*/
async function getKyberPriceTest(_from, _to, _amount) {
  const EMPTY_HINT = "0x";
  let hint = EMPTY_HINT;
  if (_from === usdc || _from === usdt) {
    
    const amount = ethers.utils.parseUnits(parseFloat(_amount).toFixed(6).toString(),"mwei")
    const forward = await kyberswap.getExpectedRateAfterFee(_from, _to, amount,0,hint)
    const rate = ethers.utils.formatEther(forward)
    const expected = forward;

    return { rate, expected }

  } else if (_from == wbtc) {
    
    const amount = ethers.utils.parseUnits(parseFloat(_amount).toFixed(8).toString(),8)
    const forward = await kyberswap.getExpectedRateAfterFee(_from, _to, amount,0,hint)
    const rate = ethers.utils.formatEther(forward)
    const expected = forward;

    return { rate, expected }

  } else {

    const forward = await kyberswap.getExpectedRateAfterFee(_from, _to, ethers.utils.parseEther(_amount.toString()),0,hint)
    const rate = ethers.utils.formatEther(forward)

    const expected = forward;

    return { rate, expected }

  }
}



async function pathFinder(_pair, _amount) {
  const exs = []
  const amountOut = []
  const expectedRates = []
  const uniPaths = []
  if (_pair[0][0] === eth) {
    _amount = 168
  }

  let choices1 = await Promise.all([
    getKyberPriceTest(_pair[0][0], _pair[0][1],_amount),
    getUniPriceTest(_pair[0][0], _pair[0][1],_amount)
  ])

  let kRate = choices1[0].rate*_amount
  
  let uRate = choices1[1].finalRate*_amount
  
  let choice1
  let step1
  if (uRate>kRate){
    choice1 = ethers.utils.formatUnits(choices1[1].amountOutMin,tokens[_pair[0][1]].decimals)
    amountOut.push(choices1[1].amountOutMin)
    uniPaths.push(choices1[1].path)
    expectedRates.push(0)
    exs.push(1)
    step1 = 'Uniswap'
  } else {
    choice1 = kRate
    expectedRates.push(choices1[0].expected)
    amountOut.push(0)
    uniPaths.push(0)
    exs.push(2)
    step1 = 'Kyber'
  }

  // console.log("Uni rate: "+uRate)
  // console.log("Kyber rate: "+kRate)
  // uRate>=kRate?console.log("choice1-Uni: "+choice1):console.log("choice1-Kyber: "+choice1 )

  let choices2 = await Promise.all([
    getKyberPriceTest(_pair[1][0], _pair[1][1], choice1),
    getUniPriceTest(_pair[1][0], _pair[1][1], choice1)
  ])
  let kRate2 = choices2[0].rate*choice1
  let uRate2 = choices2[1].finalRate*choice1
  let choice2
  let step2
  if (uRate2>kRate2){
    choice2 = ethers.utils.formatUnits(choices2[1].amountOutMin,tokens[_pair[1][1]].decimals)
    amountOut.push(choices2[1].amountOutMin)
    uniPaths.push(choices2[1].path)
    expectedRates.push(0)
    exs.push(1)
    step2 = 'Uniswap'
  } else {
    choice2 = kRate2
    expectedRates.push(choices2[0].expected)
    amountOut.push(0)
    uniPaths.push(0)
    exs.push(2)
    step2 = 'Kyber'
  }
  // console.log("Uni rate: "+uRate2)
  // console.log("Kyber rate: "+kRate2)
  // uRate2>=kRate2?console.log("choice2-Uni: "+choice2):console.log("choice2-Kyber: "+choice2)

  if (_pair.length > 2) {
    let choices3 = await Promise.all([
      getKyberPriceTest(_pair[2][0], _pair[2][1], choice2),
      getUniPriceTest(_pair[2][0], _pair[2][1], choice2)
    ])
    let kRate3 = choices3[0].rate*choice2
    let uRate3 = choices3[1].finalRate*choice2
    let choice3 
    let step3
    if (uRate3>kRate3) {
      choice3 = ethers.utils.formatUnits(choices3[1].amountOutMin,tokens[_pair[2][1]].decimals)
      amountOut.push(choices3[1].amountOutMin)
      uniPaths.push(choices3[1].path)
      expectedRates.push(0)
      exs.push(1)
      step3 = 'Uniswap'
    } else {
      choice3 = kRate3
      expectedRates.push(choices3[0].expected)
      amountOut.push(0)
      uniPaths.push(0)
      exs.push(2)
      step3 = 'Kyber'
    }
    // console.log("Uni rate: "+uRate3)
    // console.log("Kyber rate: "+kRate3)
    // uRate3>=kRate3?console.log("choice3-Uni: "+choice3):console.log("choice3-Kyber: "+choice3)
    console.log("Path->"+step1+'->'+step2+'->'+step3)
    const total = choice3 - _amount
    // console.log("Total: "+total)
    const output = {}
    output.pair = _pair
    output.total = total
    output.exs = exs
    if (total > 0) {
      ++perfomance[_pair]
    }
    output.expectedRates = expectedRates
    output.amountOut = amountOut
    output.uniPaths = uniPaths
    return output
  } else {
    console.log("Path->"+step1+'->'+step2)
    const total = choice2 - _amount
    // console.log("Total: "+total)
    const output = {}
    output.pair = _pair
    output.total = total
    output.exs = exs
    if (total > 0) {
      ++perfomance[_pair]
    }
    output.expectedRates = expectedRates
    output.amountOut = amountOut
    output.uniPaths = uniPaths
    return output
  }


}


let inTransaction = false;
async function main(_amount) {

  let ethPrice;
  let gasPrice;
  //gets the gas price for fastest rate
  const fastGasPrice = async () => {

    const url = 'https://data-api.defipulse.com/api/v1/egs/api/ethgasAPI.json?api-key=YOUR_DEFI_PULSE_API';

    return axios.get(url).then(data => data.data.fastest).catch(err => console.log(err));

  }
  //updates eth price
  const updateEthPrice = async () => {

    const results = await kyberswap.getExpectedRate(
      eth,
      dai,
      1
    );

    ethPrice = ethers.utils.formatEther(results.expectedRate);

  }

  const AMOUNT = _amount
  

  provider.on("block", async (blockNumber) => {

    console.log(`New block received. Block # ${blockNumber}`);
    if (inTransaction) {
      console.log("in transaction");
      return
    }
    const promises = await Promise.all([

      pathFinder([[eth, usdt], [usdt, usdc], [usdc, eth]], AMOUNT),
      // pathFinder([[eth, usdc], [usdc, usdt], [usdt, eth]], AMOUNT),
      // pathFinder([[eth, usdc], [usdc, dai], [dai, eth]], AMOUNT),
      // pathFinder([[eth, usdc], [usdc, eth]], AMOUNT),
      pathFinder([[eth, dai], [dai, usdc], [usdc, eth]], AMOUNT),
      // pathFinder([[eth, usdt], [usdt, eth]], AMOUNT),
      //  pathFinder([[usdt, eth], [eth, usdc], [usdc, usdt]],AMOUNT),
      //  pathFinder([[usdt, eth], [eth, susd], [susd, usdt]],AMOUNT),
      //  pathFinder([[usdc, eth], [eth, usdt], [usdt, usdc]],AMOUNT),
      //  pathFinder([[usdc, eth], [eth, dai], [dai, usdc]],AMOUNT),
      //  pathFinder([[usdc, eth], [eth, susd], [susd, usdc]],AMOUNT),
      //  pathFinder([[eth, usdc], [usdc, wbtc], [wbtc, eth]],AMOUNT),
      //  pathFinder([[eth, usdc], [usdc, usdt], [usdt, eth]],AMOUNT),
      //  pathFinder([[eth, usdc], [usdc, dai], [dai, eth]],AMOUNT),
      //  pathFinder([[dai, eth], [eth, usdc], [usdc, dai]],AMOUNT),
      //  pathFinder([[usdc, usdt], [usdt, eth], [eth, usdc]],AMOUNT),
      //  pathFinder([[usdt, usdc], [usdc, eth], [eth, usdt]],AMOUNT),
      //  pathFinder([[dai, eth], [eth, susd], [susd, dai]],AMOUNT),
      //  pathFinder([[usdc, dai], [dai, eth], [eth, usdc]],AMOUNT),
      
    ])
    // find path with highest amount
    let max = Math.max(...Array.from(promises, o => o.total));
    let best_pair = promises.find(o => o.total === max);
    console.log("Best path: "+best_pair.pair)
    console.log("Total: "+max)
    if (max > 0) {
      //set inTransaction to true to prevent second call
      inTransaction = true;
      console.log("starting transaction");
      console.log(best_pair)

      let gasEth = await Promise.all([
        updateEthPrice(),
        fastGasPrice(),
      ])
      const amount = best_pair.pair[0][0]===eth?168:AMOUNT
     
      //add 10 to highest fare to be even faster
      gasPrice = gasEth[1] / 10 +10;
      //approximate transaction cost
      let txcost = 3250000 * gasPrice / 1e9 * ethPrice;
      console.log("Tx cost: "+txcost)
      if (best_pair.pair[0][0] == eth) {
        max = max * ethPrice;
      }
      console.log(max)
      if (max >txcost) {
        const amount = best_pair.pair[0][0]===eth?168:AMOUNT
       
        //call the transaction
        console.log("calling flashloan")
        const tx = await flashloan.flashloan(
          best_pair.pair[0][0],
          best_pair.pair[1],
          best_pair.exs,
          best_pair.expectedRates,
          best_pair.amountOut,
          amount,
          best_pair.uniPaths,
          {gasLimit:4000000,gasPrice:gasPrice*1e9}
        )

        let receipt = await tx.wait()
        
        //  Inspect the transaction hash
        console.log("Tx Hash: ", receipt.transactionHash);
        console.log("Flashloan successful");
        inTransaction = false;
      }else{
        inTransaction = false;
      }
      
    }
    console.log(perfomance)
  })
    .on('error', error => {
      console.log(error);

    });

}
main(100000)
