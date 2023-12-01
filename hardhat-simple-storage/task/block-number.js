const { task } = require("hardhat/config");

// task(name, description)
task("block-number", "Prints the current block number").setAction(
  // hre is hardhat runtime enviroment
  // and it's like importing hardhat  in this function
  // we can use hre to access all the function of hardhat
  async (taskArgs, hre) => {
    // this is a javascript arrow function
    // it's another way of define function without function keyword

    const blockNumber = await hre.ethers.provider.getBlockNumber();
    console.log(`Current Block Number is: ${blockNumber}`);
  }
);
