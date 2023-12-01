// imports

// import ethers from hardhat, instead of ethers
// if u import from ethers, hardha wont necessarily know
// about different contract factories in different pieces
// we can also import run function that can execute the function
// hardhat has for us in command line like verify,check,etc
// network: control network information
const { ethers, run, network } = require("hardhat");
// async main
async function main() {
  // allready know it's compilied in the artifacts folder
  const SimpleStorageFactory = await ethers.getContractFactory("SimpleStorage");

  console.log("Deploying contract");
  const simpleStorage = await SimpleStorageFactory.deploy();

  console.log(`Deployed contract to: ${simpleStorage.target}`);
  // check network configuration
  //console.log(network.config);

  //check if the network is hardhat or testnetwork
  // if chainId is corresponding to sepolia and API key exists
  if (network.config.chainId === 11155111 && process.env.EtherScan_API_KEY) {
    await simpleStorage.deploymentTransaction().wait(6);
    await verify(simpleStorage.target, []);
  }

  const currentValue = await simpleStorage.retrieve();
  console.log(typeof currentValue.toString());
  console.log(`Current Value is: ${currentValue}`);

  //update the current value
  const transactionResponse = await simpleStorage.store(7);
  await transactionResponse.wait(1);
  const updateValue = await simpleStorage.retrieve();
  console.log(`Updated Value is: ${updateValue}`);
}

// programatic verify and publish contract with etherscan API
async function verify(contractAddress, args) {
  console.log("verify contract...");
  try {
    // run function is provided by Hardhat to execute its built-in tasks or scripts.
    // In your code snippet, run("verify:verify", ...) is using the Hardhat task
    // called verify:verify to programmatically verify and
    // publish the source code of your deployed contract on Etherscan.
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already Verified");
    } else {
      console.log(e);
    }
  }
}

// main
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
