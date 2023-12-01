const { assert, expect } = require("chai");
const { ethers } = require("hardhat");

//describe("SimpleStorage", ()=>{})
describe("SimpleStorage", function () {
  // what to do before each of our it()
  let SimpleStorageFactory;
  let simpleStorage;
  beforeEach(async function () {
    SimpleStorageFactory = await ethers.getContractFactory("SimpleStorage");
    simpleStorage = await SimpleStorageFactory.deploy();
  });
  // it() is where we write our code for test
  it("Should start with a favorite number of 0", async function () {
    const currentValue = await simpleStorage.retrieve();
    const expectedValue = "0";
    // using assertion to confront the value
    // if value of currentValue is equal to expectedValue
    // the test will pass
    assert.equal(currentValue.toString(), expectedValue);
    //expect(currentValue.toString()).to.equal(expectedValue);
  });

  it("Should update when we call store", async function () {
    const expectedValue = "7";
    const transactionResponse = await simpleStorage.store(expectedValue);
    await transactionResponse.wait(1);

    const currentValue = await simpleStorage.retrieve();
    assert.equal(currentValue.toString(), expectedValue);
  });
});
