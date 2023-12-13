require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("dotenv").config();
require("@nomicfoundation/hardhat-verify");
require("@nomiclabs/hardhat-ethers");
// import the task
require("hardhat-gas-reporter");
require("solidity-coverage");

/** @type import('hardhat/config').HardhatUserConfig */

const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ||
  "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x";

// api key for etherscan, obtain one at etherscan.io
const EtherScan_API_KEY = process.env.EtherScan_API_KEY;
const CoinMarket_API_KEY = process.env.COINMARKETCAP_API_KEY;
module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      // // If you want to do some forking, uncomment this
      // forking: {
      //   url: MAINNET_RPC_URL
      // }
      chainId: 31337,
    },
    localhost: {
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      //   accounts: {
      //     mnemonic: MNEMONIC,
      //   },
      saveDeployments: true,
      chainId: 11155111,
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: EtherScan_API_KEY,
  },
  gasReporter: {
    // set to ture will active the gas reporter
    enabled: false,
    outputFile: "gas-report.txt",
    // noColors because the color sometimes can fuck up the file
    noColors: true,
    currency: "USD",
    coinmarketcap: CoinMarket_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
    player: {
      default: 1,
    },
  },
  mocha: {
    timeout: 300000, // 300 seconds
  },
};
