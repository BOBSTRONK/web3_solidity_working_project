const { run } = require("hardhat");

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

module.exports = { verify };
