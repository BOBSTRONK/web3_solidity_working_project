// use our own contracts, instead of already etablished contracts.
// If we are on a netwrok that doesn't have any priceFeed contract, for example: hardhat or localhost
const { network } = require("hardhat");
const {
  developmentChains,
  Decimals,
  Initial_Answer,
} = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  // getNamedAccounts is a way for us to get named accounts
  // named accounts is defined in hardhat。config.js
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  console.log(network.name);
  if (developmentChains.includes(network.name)) {
    log("lOCAL NETWORK DETECTED! Deploying mocks...");
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      args: [Decimals, Initial_Answer],
    });
    log("Mock Deployed!");
    log("±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±§");
  }
};

// set tag then when we run the delopy scripts with --tags
// and it will only run the deploy scripts that have a special tag.
module.exports.tags = ["all", "mocks"];
