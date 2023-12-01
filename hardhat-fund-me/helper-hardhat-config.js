const networkConfig = {
  // sepolia
  11155111: {
    name: "sepolia",
    ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
  },
};

const developmentChains = ["hardhat", "localhost"];

const Decimals = 8;
const Initial_Answer = 200000000000;

module.exports = {
  networkConfig,
  developmentChains,
  Decimals,
  Initial_Answer,
};
