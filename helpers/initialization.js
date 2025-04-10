require("dotenv").config()
const ethers = require('ethers')

/**
 * This file could be used for initializing some
 * of the main contracts such as the V3 router & 
 * factory. This is also where we initialize the
 * main Arbitrage contract.
 */

const config = require('../config.json')
const IUniswapV3Factory = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json')
const IQuoter = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/IQuoterV2.sol/IQuoterV2.json')
const ISwapRouter = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')

// Create provider
const provider = new ethers.JsonRpcProvider(process.env.QUICKNODE_RPC_URL)
console.log("Connected to Arbitrum via QuickNode RPC")

// -- SETUP UNISWAP/SUSHISWAP CONTRACTS -- //
const uniswap = {
  name: "Uniswap V3",
  factory: new ethers.Contract(config.UNISWAP.FACTORY_V3, IUniswapV3Factory.abi, provider),
  quoter: new ethers.Contract(config.UNISWAP.QUOTER_V3, IQuoter.abi, provider),
  router: new ethers.Contract(config.UNISWAP.ROUTER_V3, ISwapRouter.abi, provider)
}

const sushiswap = {
  name: "Sushiswap V3",
  factory: new ethers.Contract(config.SUSHISWAP.FACTORY_V3, IUniswapV3Factory.abi, provider),
  quoter: new ethers.Contract(config.SUSHISWAP.QUOTER_V3, IQuoter.abi, provider),
  router: new ethers.Contract(config.SUSHISWAP.ROUTER_V3, ISwapRouter.abi, provider)
}

// -- SETUP ARBITRAGE CONTRACT -- //
const arbitrage = new ethers.Contract(
  config.PROJECT_SETTINGS.ARBITRAGE_ADDRESS,
  require('../artifacts/contracts/Arbitrage.sol/Arbitrage.json').abi,
  provider
)

module.exports = {
  provider,
  uniswap,
  sushiswap,
  arbitrage
}