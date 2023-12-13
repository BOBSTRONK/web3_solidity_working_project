// use our own contracts, instead of already etablished contracts.
// If we are on a netwrok that doesn't have any priceFeed contract, for example: hardhat or localhost
const { network, ethers } = require("hardhat");
const {
  developmentChains,
  Decimals,
  Initial_Answer,
} = require("../helper-hardhat-config");
// fee that we have to pay on every request we made for a random number.
const BASE_FEE = ethers.parseEther("0.25"); //0.25 is the premium, it costs 0.25 link, we need to pay to get this functionality
const GAS_PRICE_LINK = 1e9; //calculated value based on the gas price of chain

// IF price of ethers goes up
// chainLink nodes pay the gas fees to give us randomness & do external execution
// so they price of requests change based on the price of gas.
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  // getNamedAccounts is a way for us to get named accounts
  // named accounts is defined in hardhat.config.js
  const { deployer } = await getNamedAccounts();
  const args = [BASE_FEE, GAS_PRICE_LINK];
  // get chainID because only want to deploy on the hardhat network
  const chainId = network.config.chainId;
  console.log(network.name);
  if (developmentChains.includes(network.name)) {
    log("lOCAL NETWORK DETECTED! Deploying mocks...");
    // deploy VRFcoordinator
    await deploy("VRFCoordinatorV2Mock", {
      contract: "VRFCoordinatorV2Mock",
      from: deployer,
      log: true,
      args: args,
    });
    log("Mock Deployed!");
    log("±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±§");
  }
};

// set tag then when we run the delopy scripts with --tags
// and it will only run the deploy scripts that have a special tag.
module.exports.tags = ["all", "mocks"];
