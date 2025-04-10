# Arbitrage Trading Bot for Arbitrum

An automated trading bot that monitors price differences between decentralized exchanges (DEXs) on the Arbitrum network and executes flash loan arbitrage when profitable opportunities are detected.

## Features

- **Price Monitoring**: Continuously monitors token prices across multiple DEXs (Uniswap, SushiSwap, etc.)
- **Arbitrage Detection**: Identifies price discrepancies that exceed a configurable threshold
- **Flash Loan Execution**: Utilizes Balancer flash loans to execute arbitrage trades without requiring capital
- **Multiple Token Support**: Monitors multiple token pairs simultaneously
- **Configurable Parameters**: Easily adjust trading parameters like threshold, gas price, etc.

## Bot Versions

- **bot-monitor.js**: Monitoring-only version that identifies arbitrage opportunities without executing trades
- **bot-live.js**: Live trading version that executes real trades when opportunities are found
- **bot-flashloan.js**: Fixed version with proper flash loan implementation

## Setup

1. Clone the repository
```
git clone https://github.com/Faith5411/arbitrage-trading-bot.git
cd arbitrage-trading-bot
```

2. Install dependencies
```
npm install
```

3. Configure environment variables
```
cp .env.example .env
```
Edit the `.env` file to add your:
- Private key
- RPC endpoint URLs
- Other configuration parameters

4. Configure trading parameters in `config.json`

## Usage

### Monitoring Only (No Trading)
```
node bot-monitor.js
```

### Live Trading (Use with caution!)
```
node bot-live.js
```

### Flash Loan Trading
```
node bot-flashloan.js
```

## Warning

This bot involves real cryptocurrency trading and flash loans. Use at your own risk and only with funds you can afford to lose. Always test thoroughly on testnets before using on mainnet.

## License

MIT