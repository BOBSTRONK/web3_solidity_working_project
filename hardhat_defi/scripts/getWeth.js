const { getNamedAccounts, ethers } = require("hardhat");

const Amount = ethers.parseEther("0.02");

async function getWeth() {
  const { deployer } = await getNamedAccounts();
  // 有的时候,就是要用signer来change the state of the contract (as we are using the deposit function)
  const signer = await ethers.provider.getSigner();
  console.log(`this i deployer ${deployer}`);
  console.log(`this is signer ${signer.address}`);
  // call the "deposit" function on weth contract
  // abi, contract address
  // 1. give the contract, and it'll get the api
  // 2. give the interface, this is not going to give all the functionality, but will give you the ABI
  // 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 contract address from mainnet
  const iWeth = await ethers.getContractAt(
    "IWeth",
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    signer
  );
  const tx = await iWeth.deposit({ value: Amount });
  await tx.wait(1);
  const wethBalance = await iWeth.balanceOf(deployer);
  console.log(`Got ${wethBalance.toString()} Weth`);
}

module.exports = { getWeth, Amount };
