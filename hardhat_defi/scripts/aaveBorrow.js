const { ethers } = require("hardhat");
const { getWeth, Amount } = require("../scripts/getWeth");
async function main() {
  // the protocol treats everything like a ERC20 token
  // using everything as ERC20 token as a standard
  // makes things ez
  await getWeth();
  const { deployer } = await getNamedAccounts();
  const signer = await ethers.provider.getSigner();
  // interact with Aave
  // Address: 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
  // ABI

  const lendingPool = await getLendingPool();
  console.log(`LendingPool address ${lendingPool.target}`);

  // before we can deposit, we need to approve to get our Weath Token
  const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  // approve: pull the money out of our wallet, approve the Avve contract
  // lendingPoo.target: because we want to give lendingPool the approval to pull our weathToken
  // from our account
  await approveErc20(wethTokenAddress, lendingPool.target, Amount, signer);
  console.log("Depositing");
  // deposits a certain amount of WethToken into the protocol, minting the same amount
  // of aTokens, and transferring them to the deployer address
  // 0: refferal code (回信)
  await lendingPool.deposit(wethTokenAddress, Amount, deployer, 0);
  console.log("Deposited");

  // Borrow
  // how much we have borrowed, how much we have in collateral, how much we can borrow?
  let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(
    lendingPool,
    deployer
  );

  // conversion rate on Dai
  // using chainlink aggregator
  const daiPrice = await getDaiPrice();

  const amounDaiToBorrow =
    availableBorrowsETH.toString() * 0.95 * (1 / Number(daiPrice));

  console.log(`you can borrow ${amounDaiToBorrow} Dai`);

  const amountDaiToBorrowWei = ethers.parseEther(amounDaiToBorrow.toString());
  // address of Dai Token (It's a contract)
  const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  await borrowDai(daiTokenAddress, lendingPool, amountDaiToBorrowWei, deployer);
  await getBorrowUserData(lendingPool, deployer);

  await repay(amountDaiToBorrowWei, daiTokenAddress, lendingPool, signer);
  await getBorrowUserData(lendingPool, deployer);
}

async function repay(amount, daiAddress, lendingPool, account) {
  // we need to approve sending our dai back to Aave
  await approveErc20(daiAddress, lendingPool.target, amount, account);
  const repayTx = await lendingPool.repay(daiAddress, amount, 2, account);
  await repayTx.wait(1);
  console.log("Repaid!");
}

async function borrowDai(daiAddress, lendingPool, amountDaiToBorrow, account) {
  const borrowTx = await lendingPool.borrow(
    daiAddress,
    amountDaiToBorrow,
    2,
    0,
    account
  );
  await borrowTx.wait(1);
  console.log("You've borrowed!");
}

async function getDaiPrice() {
  // no need to connect with a signer, because we are not sending any transaciton
  const daiEthPriceFeed = await ethers.getContractAt(
    "AggregatorV3Interface",
    "0x773616E4d11A78F511299002da57A0a94577F1f4"
  );
  // only want 1st index return value (answer)
  const price = (await daiEthPriceFeed.latestRoundData())[1];
  console.log(`The DAI/ETH price is ${price.toString()}`);
  return price;
}

async function getBorrowUserData(lendingPool, account) {
  // pull uot the value
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account);
  console.log(`You have ${totalCollateralETH} worth of ETH deposited.`);
  console.log(`You have ${totalDebtETH} worth of ETH borrowed.`);
  console.log(`You can borrow ${availableBorrowsETH} worth of ETH.`);
  return { availableBorrowsETH, totalDebtETH };
}
async function getLendingPool() {
  const signer = await ethers.provider.getSigner();
  const lendingPoolAddressProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
    signer
  );

  // give us the address of lendingpool
  const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool();

  const lendingPool = await ethers.getContractAt(
    "ILendingPool",
    lendingPoolAddress,
    signer
  );

  return lendingPool;
}

// if ur not running this function before you try to deposit,
// you will just get an error, token is not approved
async function approveErc20(erc20Address, spenderAddress, amount, signer) {
  const erc20Token = await ethers.getContractAt("IERC20", erc20Address, signer);
  txResponse = await erc20Token.approve(spenderAddress, amount);
  await txResponse.wait(1);
  console.log("Approved!");
}

// main
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
