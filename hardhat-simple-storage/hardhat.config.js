require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomicfoundation/hardhat-verify");
// import the task
require("./task/block-number");
require("hardhat-gas-reporter");
require("solidity-coverage");

/** @type import('hardhat/config').HardhatUserConfig */

// || this is or syntax, in javascript, it means if process.env.sepolia_rpc_url is not defined, then it will be https://
const sepolia_RPC_URL =
  process.env.SEPOLIA_RPC_URL || "https://sepolia/example";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const Etherscan_API_KEY = process.env.EtherScan_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    sepolia: {
      url: sepolia_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      // accounts: hardhat will automatically place one of account
      chainId: 31337,
    },
  },
  solidity: "0.8.19",
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: Etherscan_API_KEY,
  },
  gasReporter: {
    // set to ture will active the gas reporter
    enabled: false,
    outputFile: "gas-report.txt",
    // noColors because the color sometimes can fuck up the file
    noColors: true,
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY,
  },
};
