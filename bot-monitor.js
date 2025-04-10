// Arbitrage Monitoring Bot (No Trading)
require("dotenv").config();
const ethers = require("ethers");
const config = require("./config.json");
const { provider, uniswap } = require("./helpers/initialization");
const IERC20 = require('@openzeppelin/contracts/build/contracts/ERC20.json');
const IUniswapV3Pool = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');

// MONITORING SETTINGS
const PRICE_DIFFERENCE_THRESHOLD = config.PROJECT_SETTINGS.PRICE_DIFFERENCE_THRESHOLD;
const CHECK_INTERVAL = 30000; // Check every 30 seconds

console.log("🔍 STARTING ARBITRAGE MONITORING BOT");
console.log(`Connected to Arbitrum mainnet via QuickNode`);
console.log(`Monitoring ${Object.keys(config.TOKEN_PAIRS).length} token pairs for arbitrage opportunities`);
console.log(`Price difference threshold: ${PRICE_DIFFERENCE_THRESHOLD}%\n`);

// Initialize token pairs (Uniswap only)
async function initializeTokenPairs() {
  const tokenPairs = {};
  let successCount = 0;

  for (const pairKey in config.TOKEN_PAIRS) {
    try {
      const pairConfig = config.TOKEN_PAIRS[pairKey];
      
      // Get token contracts
      const token0Contract = new ethers.Contract(config.TOKENS.WETH, IERC20.abi, provider);
      const token1Contract = new ethers.Contract(pairConfig.tokenAddress, IERC20.abi, provider);
      
      // Get token info
      const token0 = {
        contract: token0Contract,
        address: config.TOKENS.WETH,
        symbol: await token0Contract.symbol(),
        decimals: await token0Contract.decimals()
      };
      
      const token1 = {
        contract: token1Contract,
        address: pairConfig.tokenAddress,
        symbol: await token1Contract.symbol(),
        decimals: await token1Contract.decimals()
      };
      
      // Get Uniswap pool address
      const uniswapPoolAddress = await uniswap.factory.getPool(
        token0.address, 
        token1.address, 
        pairConfig.feeTier
      );
      
      // Check if Uniswap pool exists
      if (uniswapPoolAddress === ethers.ZeroAddress) {
        console.log(`Skipping ${pairKey}: Uniswap pool does not exist`);
        continue;
      }
      
      // Get Uniswap pool contract
      const uniswapPool = new ethers.Contract(uniswapPoolAddress, IUniswapV3Pool.abi, provider);
      
      // Store pair info
      tokenPairs[pairKey] = {
        token0,
        token1,
        uniswapPool,
        feeTier: pairConfig.feeTier,
        poolAddress: uniswapPoolAddress
      };
      
      successCount++;
      console.log(`Successfully initialized ${pairKey} pair (Pool: ${uniswapPoolAddress})`);
    } catch (error) {
      console.error(`Error initializing pair ${pairKey}:`, error.message);
    }
  }
  
  console.log(`\nSuccessfully initialized ${successCount} token pairs`);
  return tokenPairs;
}

// Check prices and monitor for significant price movements
async function monitorPrices(tokenPairs) {
  console.log(`\n[${new Date().toISOString()}] Checking prices...`);
  
  for (const pairKey in tokenPairs) {
    try {
      const pair = tokenPairs[pairKey];
      
      // Get price data from Uniswap
      const uniSlot0 = await pair.uniswapPool.slot0();
      const uniSqrtPriceX96 = uniSlot0[0];
      const tick = uniSlot0[1];
      
      // Calculate Uniswap price
      const decimalsAdjustment = Number(pair.token0.decimals) - Number(pair.token1.decimals);
      const uniNumerator = uniSqrtPriceX96 * uniSqrtPriceX96;
      const uniDenominator = 2n ** 192n;
      const uniPrice = Number(ethers.formatUnits(uniNumerator / uniDenominator, 0));
      
      // Get token prices from mock price source
      const token0Price = await getTokenPrice(pair.token0.address);
      const token1Price = await getTokenPrice(pair.token1.address);
      
      // Calculate price ratio
      const calculatedRatio = token0Price / token1Price;
      const onChainRatio = uniPrice;
      
      // Calculate price difference between on-chain and off-chain sources
      const priceDifference = Math.abs((calculatedRatio - onChainRatio) / onChainRatio * 100);
      
      console.log(`\n${pairKey} - Current tick: ${tick}`);
      console.log(`Pool address: ${pair.poolAddress}`);
      console.log(`On-chain price: 1 ${pair.token0.symbol} = ${uniPrice.toFixed(8)} ${pair.token1.symbol}`);
      console.log(`Off-chain price: 1 ${pair.token0.symbol} = ${calculatedRatio.toFixed(8)} ${pair.token1.symbol}`);
      console.log(`Difference: ${priceDifference.toFixed(2)}%`);
      
      // Check if arbitrage opportunity exists
      if (priceDifference >= PRICE_DIFFERENCE_THRESHOLD) {
        console.log(`\n🚨 ARBITRAGE OPPORTUNITY FOUND for ${pairKey}!`);
        console.log(`Price difference: ${priceDifference.toFixed(2)}%`);
        
        // Determine direction (buy on the cheaper source)
        let buyOnUniswap = onChainRatio < calculatedRatio;
        
        console.log(`Buy on ${buyOnUniswap ? 'Uniswap' : 'External Market'}, sell on ${buyOnUniswap ? 'External Market' : 'Uniswap'}`);
        console.log(`Potential profit: ${(priceDifference / 100 * config.PROJECT_SETTINGS.AMOUNT_IN).toFixed(6)} ETH (minus gas and fees)`);
      }
    } catch (error) {
      console.error(`Error monitoring ${pairKey}:`, error.message);
    }
  }
}

// Helper function to get token price from mock source
async function getTokenPrice(tokenAddress) {
  try {
    // For simplicity, return a mock price based on the token address
    if (tokenAddress.toLowerCase() === config.TOKENS.WETH.toLowerCase()) {
      return 1500; // Mock WETH price in USD
    } else if (tokenAddress.toLowerCase() === config.TOKENS.ARB_AGAINST.toLowerCase()) {
      return 0.28; // Mock ARB price in USD
    } else if (tokenAddress.toLowerCase() === config.TOKENS.ADDITIONAL_TOKENS.USDC.toLowerCase()) {
      return 1.0; // Mock USDC price in USD
    } else if (tokenAddress.toLowerCase() === config.TOKENS.ADDITIONAL_TOKENS.USDT.toLowerCase()) {
      return 1.0; // Mock USDT price in USD
    } else if (tokenAddress.toLowerCase() === config.TOKENS.ADDITIONAL_TOKENS.WBTC.toLowerCase()) {
      return 78000; // Mock WBTC price in USD
    } else if (tokenAddress.toLowerCase() === config.TOKENS.ADDITIONAL_TOKENS.GMX.toLowerCase()) {
      return 13.5; // Mock GMX price in USD
    } else if (tokenAddress.toLowerCase() === config.TOKENS.ADDITIONAL_TOKENS.LINK.toLowerCase()) {
      return 12.0; // Mock LINK price in USD
    } else {
      // For other tokens, generate a random price between 0.1 and 100
      return Math.random() * 100;
    }
  } catch (error) {
    console.error(`Error getting token price for ${tokenAddress}:`, error.message);
    return 1; // Default fallback price
  }
}

// Main function
async function main() {
  try {
    // Initialize token pairs
    const tokenPairs = await initializeTokenPairs();
    
    if (Object.keys(tokenPairs).length === 0) {
      console.error("No valid token pairs initialized. Exiting...");
      return;
    }
    
    // Initial check
    await monitorPrices(tokenPairs);
    
    // Set up interval to check for arbitrage opportunities
    console.log(`\nMonitoring prices every ${CHECK_INTERVAL / 1000} seconds...`);
    const checkInterval = setInterval(async () => {
      await monitorPrices(tokenPairs);
    }, CHECK_INTERVAL);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nStopping monitoring bot...');
      clearInterval(checkInterval);
      process.exit(0);
    });
    
  } catch (error) {
    console.error("Fatal error:", error);
  }
}

// Start the bot
main();