// node.js you use require() to import things
// in front-end javascript, you can't use require,you use import instead

import { ethers } from "./ethers.esm.min.js";
// ABI & Address of contract
// abi of the contract which you deploied
import { abi, contractAddress } from "./constants.js";
const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const balanceButton = document.getElementById("balanceButton");
const withdrawButton = document.getElementById("withdrawButton");
withdrawButton.onclick = withdraw;
connectButton.onclick = connect;
fundButton.onclick = fund;
balanceButton.onclick = getBalance;

console.log(ethers);

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    connectButton.innerHTML = "Connected!";
  } else {
    connectButton.innerHTML = "Please install the MetaMask!";
  }
}

async function fund() {
  const ethAmount = document.getElementById("ethAmount").value;

  console.log(`Funding with ${ethAmount}`);

  if (typeof window.ethereum !== "undefined") {
    // provider / conncetion to the blockchain
    // take http endpoint and automatically sticks it in ethers for us.
    // it's like find http endpoint inside metamask, and that's going to be what we are going to use
    // as our provider here
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    // signer / wallet / someone with some gas
    // return which wallet we are connect with metamask (provider)
    const signer = provider.getSigner();
    console.log(signer);
    // contract that we are interacting with
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const transactionResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      });
      // listen for transaction to be mined
      await listenForTransactionMine(transactionResponse, provider);
      console.log("done!");
    } catch (error) {
      console.log(error);
    }
  }
}

// wait for transaction to be mine
function listenForTransactionMine(transactionResponse, provider) {
  console.log(`Minning ${transactionResponse.hash}...`);

  // in real world, we should implement reject too
  // this promise only retunrs, once a resolve or reject is called

  return new Promise((resolve, reject) => {
    //once we got the hash we call the listener function
    provider.once(transactionResponse.hash, (transactionReceipt) => {
      console.log(
        `Completed with ${transactionReceipt.confirmations} confirmations`
      );
      // once transaction is fired, we going to resolve
      resolve();
    });
  });
  // create a listener for blockchain
  // we want to listen for this event to happen, and wait for this thing to finish looking
}

async function getBalance() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(contractAddress);
    console.log(ethers.utils.formatEther(balance));
  }
}

async function withdraw() {
  if (typeof window.ethereum !== "undefined") {
    console.log("withdrawing.....");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const transactionResponse = await contract.withdraw();
      await listenForTransactionMine(transactionResponse, provider);
    } catch (error) {
      console.log(error);
    }
  }
}
