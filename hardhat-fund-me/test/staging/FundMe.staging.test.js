const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundME", async function () {
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

        // in the staging test, we are not going to deploy any contract
        // because we are assuming that it's already deployed here.
        // await deployments.fixture(["all"]);

        // going to get the most recent deployment of whatever contract
        // we tell it. because we deployied the contract with fixture, so we can get them now.
        // deployer: which account connected to the fund me
        FundMe = await ethers.getContract("FundMe", deployer);

        // we also do not need a mock, because on a staging we are assuming we are in a testNet
        //mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
        //const mockAddress = await mockV3Aggregator.getAddress();
      });
      it("allows people to fund and withdraw", async function () {
        await FundMe.fund({ value: sendValue });
        await FundMe.withdraw();
        const endingBalance = await ethers.provider.getBalance(FundMe.target);
        assert.equal(endingBalance.toString(), "0");
      });
    });
