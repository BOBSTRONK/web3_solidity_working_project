// use hardhat deploy, to automatically set up our tests as if both of these deploye functions
// had been run.

const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

// for entire FundMe contract
!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
      let FundMe;
      let deployer;
      let mockV3Aggregator;
      // parse the ethers
      let sendValue; // 1 ETH
      beforeEach(async function () {
        // deploy our fundMe contract
        // using hardhat-deploy package
        deployer = (await getNamedAccounts()).deployer;
        // use parse ethers instead of utils.parseEther
        sendValue = ethers.parseEther("1");

        // get whatever in the section of your network, if you're on your default network
        // if you are in your default network hardhat, it will give you a list of 10 fake accounts
        // const accounts = await ethers.getSigners();
        // const accountZero = accounts[0];
        console.log("testing here");
        // fixture does is it allows us to basically run our
        // entire deploy folder with as many tags as we want
        // deploy everything in that deploy folder with just one line
        await deployments.fixture(["all"]);
        // going to get the most recent deployment of whatever contract
        // we tell it. because we deployied the contract with fixture, so we can get them now.
        // deployer: which account connected to the fund me
        FundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
        const mockAddress = await mockV3Aggregator.getAddress();
      });
      describe("constructor", async function () {
        it("sets the aggregator addresses correctly", async function () {
          // can call the getPriceFeed because it's a state Variable,
          // in solidity, when you declare a state variable as public,
          // the compiler automatically generates a getter function with the same name as the variable
          const response = await FundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.target);
        });
      });
      describe("fund", async function () {
        // expect to fail if we do not send enough eth
        it("Fails if you don't send enought ETH", async function () {
          // use waffle, so if it do not pass, it's ok
          await expect(FundMe.fund()).to.be.revertedWith(
            // this message should respond exactly as the revert message in the FundMe contract
            "You need to spend more ETH!"
          );
        });
        it("updated the amount funded data structure", async function () {
          // you can interact with fund function like this
          // because it's a payble function in solidity, and even it don't take any arguments
          // you can still pass the arguments like this
          await FundMe.fund({ value: sendValue });
          const response = await FundMe.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });

        it("Adds funder to array of getFunder", async function () {
          await FundMe.fund({ value: sendValue });
          const funder = await FundMe.getFunder(0);
          assert.equal(funder, deployer);
        });
      });

      describe("withdraw", async function () {
        // fund first
        beforeEach(async function () {
          await FundMe.fund({ value: sendValue });
        });

        it("withdraw ETH from a single founder", async function () {
          // arrange

          //get starting balance of the contract and deployer
          // get the balance of any contract
          const startingFundMeBalance = await ethers.provider.getBalance(
            FundMe.target
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );
          // act
          const transactionResponse = await FundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          // GET GAS COST FROM TRANSACTIONRECEIPT
          // gasUsed is a variable in transaction Receipt
          const { gasUsed, gasPrice } = transactionReceipt;
          // the effective gas cost
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            FundMe.target
          );

          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );
          // assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );
        });

        it("allows us to withdraw with multiple getFunder", async function () {
          //arrange
          const accounts = await ethers.getSigners();
          // start with index 1, because 0 will be deplyer
          for (let i = 1; i < 6; i++) {
            // from this line "FundMe = await ethers.getContract("FundMe", deployer);"
            // fundMe was connected to the deploy account, and everytime we call a transaction, it's deployer that executes it
            // so we need to connect to the other account
            const fundMeConnectedContract = await FundMe.connect(accounts[i]);

            await fundMeConnectedContract.fund({ value: sendValue });
            console.log(`Deployer address: ${deployer}`);
            const connectedAdress = await fundMeConnectedContract.getAddress();
            // use address for accounts that had  from getSigners()
            console.log(`connected account: ${accounts[i].address}`);
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            FundMe.target
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // act
          const transactionResponse = await FundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait();

          // GET GAS COST FROM TRANSACTIONRECEIPT
          // gasUsed is a variable in transaction Receipt
          const { gasUsed, gasPrice } = transactionReceipt;
          // the effective gas cost
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            FundMe.target
          );

          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          //assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );

          // make sure the getFunder are reset properly
          await expect(FundMe.getFunder(0)).to.be.reverted;

          // all the getFunder in the map, the number of fund is equal to 0
          for (i = 1; i < 6; i++) {
            assert.equal(
              await FundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });
        it("Only allows the owner to withdraw", async function () {
          const accounts = await ethers.getSigners();
          const attackerConneectedContract = await FundMe.connect(accounts[1]);
          await expect(
            attackerConneectedContract.withdraw()
          ).to.be.revertedWithCustomError(FundMe, "FundMe_NotOwner");
        });
        it("allows us to Cheaperwithdraw with multiple getFunder", async function () {
          //arrange
          const accounts = await ethers.getSigners();
          // start with index 1, because 0 will be deplyer
          for (let i = 1; i < 6; i++) {
            // from this line "FundMe = await ethers.getContract("FundMe", deployer);"
            // fundMe was connected to the deploy account, and everytime we call a transaction, it's deployer that executes it
            // so we need to connect to the other account
            const fundMeConnectedContract = await FundMe.connect(accounts[i]);

            await fundMeConnectedContract.fund({ value: sendValue });
            console.log(`Deployer address: ${deployer}`);
            const connectedAdress = await fundMeConnectedContract.getAddress();
            // use address for accounts that had  from getSigners()
            console.log(`connected account: ${accounts[i].address}`);
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            FundMe.target
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // act
          const transactionResponse = await FundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait();

          // GET GAS COST FROM TRANSACTIONRECEIPT
          // gasUsed is a variable in transaction Receipt
          const { gasUsed, gasPrice } = transactionReceipt;
          // the effective gas cost
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            FundMe.target
          );

          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          //assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );

          // make sure the getFunder are reset properly
          await expect(FundMe.getFunder(0)).to.be.reverted;

          // all the getFunder in the map, the number of fund is equal to 0
          for (i = 1; i < 6; i++) {
            assert.equal(
              await FundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });
      });
    });
