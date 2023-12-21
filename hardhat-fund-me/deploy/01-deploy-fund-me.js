//import

// we can write our deploy function in this way

// async function deployFunc(hre) {
//   console.log("HI");
// }

// module.exports.default = deployFunc;

// function declaration
// module.exports = async({getNamedAccounts,deployments}) => {
// }

// const helperConfig= require("../helper-hardhat-config");
// const networkConfig = helperConfig.networkConfig;
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { network } = require("hardhat");
require("dotenv");
const { verify } = require("../utils/verify");

module.exports = async (hre) => {
  //another way of importing from hardhat
  // hre.getNamedAccounts and hre.deployments
  // "deployments" objects provides functions and methods to interact with the deployment process
  // allowing you to deploy and manage smart contracts
  const { getNamedAccounts, deployments } = hre;
  const { deploy, log } = deployments;
  // getNamedAccounts is a way for us to get named accounts
  // named accounts is defined in hardhat。config.js
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];

  let ethUsdPriceFeedAddress;
  if (developmentChains.includes(network.name)) {
    // deployments.get is function used to retrieve information about a deployed contract.
    // returns the object containing information about the specified deployed contract
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    // if it's not default address
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }

  // create a mock contract, if the chainID is not in the networkConfig dict

  // when going for localhost or hardhat network, we want to use mock
  // mock is creating objects that simulate the behavior of real objects
  const args = [ethUsdPriceFeedAddress];
  const fundMe = await deploy("FundMe", {
    // who is deploying this
    from: deployer,
    args: args, // its args for the construct,put price feed address, because the constructore need the address
    log: true, // set log to be true, to give the log information in the terminal when we execute yarn hardhat node
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  // if we are in the real test network
  if (
    !developmentChains.includes(network.name) &&
    process.env.EtherScan_API_KEY
  ) {
    //verify and publish on the chain
    await verify(fundMe.address, args);
  }
  log("±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±§");
};

module.exports.tags = ["all", "fundme"];
