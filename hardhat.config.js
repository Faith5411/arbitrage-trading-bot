require("dotenv").config()
require("@nomicfoundation/hardhat-toolbox")

const privateKey = process.env.PRIVATE_KEY || ""

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.QUICKNODE_RPC_URL,
        blockNumber: 223528000
      },
    },
    arbitrum: {
      url: process.env.QUICKNODE_RPC_URL,
      accounts: privateKey.startsWith('0x') ? [privateKey] : [`0x${privateKey}`],
      chainId: 42161
    }
  }
};