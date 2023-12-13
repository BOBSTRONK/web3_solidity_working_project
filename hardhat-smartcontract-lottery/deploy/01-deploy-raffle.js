const { network, ethers } = require("hardhat");
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

const VRF_SUB_FUND_AMOUNT = ethers.parseEther("2");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  let vrfCoordinator, subscriptionId;

  if (developmentChains.includes(network.name)) {
    // deployments.get is function used to retrieve information about a deployed contract.
    // if we are in our localnetwork, it will be allready deployed our contract
    // returns the object containing information about the specified deployed contract
    const contractAddress = (await deployments.get("VRFCoordinatorV2Mock"))
      .address;
    const VRFCoordinatorV2Mock = await ethers.getContractAt(
      "VRFCoordinatorV2Mock",
      contractAddress
    );
    vrfCoordinator = VRFCoordinatorV2Mock.target;
    console.log(`the address of VRF: ${vrfCoordinator}`);
    const transactionResponse = await VRFCoordinatorV2Mock.createSubscription();
    // inside this transactionReceipt, there is an event emitted with our subscription in the log
    const transactionReceipt = await transactionResponse.wait();
    console.log(transactionReceipt.logs[0].args);
    subscriptionId = transactionReceipt.logs[0].args.subId;
    // fund the subscription, usually, you'd need the link token on a real network.
    await VRFCoordinatorV2Mock.fundSubscription(
      subscriptionId,
      VRF_SUB_FUND_AMOUNT
    );
  } else {
    // if it's not default address
    // it will be address of the contract in the testnet (sepolia here)
    console.log(`chainId : ${chainId}`);
    vrfCoordinator = networkConfig[chainId]["VRFCoordinatorV2"];
    subscriptionId = networkConfig[chainId]["subscriptionId"];
  }
  const entranceFee = networkConfig[chainId]["entranceFee"];
  const gasLane = networkConfig[chainId]["gasLane"];
  const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
  const interval = networkConfig[chainId]["interval"];
  const args = [
    vrfCoordinator,
    entranceFee,
    gasLane,
    subscriptionId,
    callbackGasLimit,
    interval,
  ];
  const raffle = await deploy("Raffle", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  // Ensure the Raffle contract is a valid consumer of the VRFCoordinatorV2Mock contract.
  // if (developmentChains.includes(network.name)) {
  //   log(`Adding Consumer...`);
  //   const VRFCoordinatorV2Mock = await ethers.getContract(
  //     "VRFCoordinatorV2Mock"
  //   );
  //   await VRFCoordinatorV2Mock.addConsumer(subscriptionId, raffle.address);
  //   log(`Consumer Successfully Added!`);
  // }
  // // Checking If Deployed Raffle Is Added To Consumer List...
  // // Adding Raffle Contract To Consumer List If It Is Not...
  // else {
  //   const getConsumers = await vrfCoordinatorV2.getSubscription(subscriptionId);
  //   const { 0: balance, 1: reqCount, 2: owner, 3: consumers } = getConsumers;
  //   log(`Consumers: ${consumers}`);
  //   if (!consumers.includes(raffle.address)) {
  //     log(`Adding Consumer...`);
  //     const addConsumerTxResponse = await vrfCoordinatorV2.addConsumer(
  //       subscriptionId,
  //       raffle.address
  //     );
  //     await addConsumerTxResponse.wait();
  //     const getConsumer = await vrfCoordinator.getSubscription(subscriptionId);
  //     const { 0: balance, 1: reqCount, 2: owner, 3: consumer } = getConsumer;
  //     log(`Consumer Successfully Added! Consumers: ${consumer}`);
  //   }
  // }
  // if we are in the real test network
  if (
    !developmentChains.includes(network.name) &&
    process.env.EtherScan_API_KEY
  ) {
    //verify and publish on the chain
    log("Verifying....");
    await verify(raffle.address, args);
    log("--------------------------------------------");
  }
};

module.exports.tags = ["all", "raffle"];
