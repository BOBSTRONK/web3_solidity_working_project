const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit Tests", async function () {
      let raffle,
        vrfCoordinatorV2Mock,
        deployer,
        chainId,
        raffleEntranceFee,
        interval,
        accounts;
      beforeEach(async function () {
        chainId = network.config.chainId;
        deployer = (await getNamedAccounts()).deployer;
        accounts = await ethers.getSigners();
        // fixture does is it allows us to basically run our
        // entire deploy folder with as many tags as we want
        // deploy everything in that deploy folder with just one line
        await deployments.fixture(["all"]);
        raffle = await ethers.getContract("Raffle", deployer);
        vrfCoordinatorV2Mock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
        raffleEntranceFee = await raffle.getEntraceFee();
        interval = await raffle.getInterval();
      });
      describe("constructor", async function () {
        it("initializes the raffle correctly", async function () {
          // ideally we make our tests have just 1 assert per "it"
          const raffleState = await raffle.getRaffleState();
          const interval = await raffle.getInterval();
          // Because it will be initialized as OPEN,(OPEN should be 0)
          assert.equal(raffleState.toString(), "0");
          assert.equal(interval.toString(), networkConfig[chainId]["interval"]);
        });
      });

      describe("enter raffle", async function () {
        it("revert when you don't pay enough", async function () {
          await expect(raffle.enterRaffle()).to.be.revertedWithCustomError(
            raffle,
            "Raffle_NotEnoughETHEntered"
          );
        });

        it("records players when they enter", async function () {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          const playerFromContract = await raffle.getPlayer(0);
          assert.equal(playerFromContract, deployer);
        });

        it("emits event on enter", async function () {
          // expect to emit a event using .to.emit
          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee })
          ).to.emit(raffle, "RaffleEnter");
        });

        it("doesn't allow entrance when raffle is calculating", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          // for a documentation of the methods below, go here: https://hardhat.org/hardhat-network/reference
          await network.provider.send("evm_increaseTime", [
            // INCREASE the time by whatever interval is, to get sure that we get checkupKeep retrun true,
            // so it will execute performUpkeep
            Number(interval) + 1,
          ]);
          // mine one extra block
          await network.provider.request({ method: "evm_mine", params: [] });
          // we pretend to be a keeper for a second
          const emptyByteArray = ethers.array;
          await raffle.performUpkeep(ethers.toUtf8Bytes("")); // changes the state to calculating for our comparison below
          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee })
          ).to.be.revertedWithCustomError(raffle, "Raffle_NotOpen");
        });
      });

      describe("checkUpKeep", async function () {
        it("returns false if people haven't sent any ETH", async () => {
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          // callStatic is simulating calling the transaction and see what it will respond
          // this will return the upkeepNeeeded and bytes of performData
          const { upkeepNeeded } = await raffle.checkUpkeep(
            ethers.toUtf8Bytes("")
          ); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          // because upkeepNeeded will return false, so we set !false = true
          assert(!upkeepNeeded);
        });
        it("returns false if raffle isn't open", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          await raffle.performUpkeep(ethers.toUtf8Bytes("")); // changes the state to calculating
          const raffleState = await raffle.getRaffleState(); // stores the new state
          const { upkeepNeeded } = await raffle.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          assert.equal(raffleState.toString() == "1", upkeepNeeded == false);
        });
        it("returns false if enough time hasn't passed", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) - 5,
          ]); // use a higher number here if this test fails
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          assert(!upkeepNeeded);
        });
        it("returns true if enough time has passed, has players, eth, and is open", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          assert(upkeepNeeded);
        });
      });
      describe("performUpkeep", function () {
        it("can only run if checkupkeep is true", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const tx = await raffle.performUpkeep("0x");
          assert(tx);
        });
        it("reverts if checkup is false", async () => {
          await expect(
            raffle.performUpkeep("0x")
          ).to.be.revertedWithCustomError(raffle, "Raffle_UpkeepNotNeeded");
        });
        it("updates the raffle state and emits a requestId", async () => {
          // Too many asserts in this test!
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const txResponse = await raffle.performUpkeep("0x"); // emits requestId
          const txReceipt = await txResponse.wait(1); // waits 1 block
          const raffleState = await raffle.getRaffleState(); // updates state
          // it will be the second event after requestRandomWords, because requestRandomWords will emit a event too
          const requestId = txReceipt.logs[1].args.requestId;
          assert(Number(requestId) > 0);
          assert(raffleState == 1); // 0 = open, 1 = calculating
        });
      });
      describe("fulfillRandomWords", function () {
        beforeEach(async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            Number(interval) + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
        });
        it("can only be called after performupkeep", async () => {
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.target) // reverts if not fulfilled
          ).to.be.revertedWith("nonexistent request");
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.target) // reverts if not fulfilled
          ).to.be.revertedWith("nonexistent request");
        });

        // This test is too big...
        // This test simulates users entering the raffle and wraps the entire functionality of the raffle
        // inside a promise that will resolve if everything is successful.
        // An event listener for the WinnerPicked is set up
        // Mocks of chainlink keepers and vrf coordinator are used to kickoff this winnerPicked event
        // All the assertions are done once the WinnerPicked event is fired
        it("picks a winner, resets, and sends money", async () => {
          const additionalEntrances = 3; // to test
          const startingIndex = 1; //deployer = 0
          let startingBalance;
          const accounts = await ethers.getSigners();
          for (
            let i = startingIndex;
            i < startingIndex + additionalEntrances;
            i++
          ) {
            // i = 2; i < 5; i=i+1
            const raffleContract = await raffle.connect(accounts[i]); // Returns a new instance of the Raffle contract connected to player
            console.log(accounts[i].address);
            await raffleContract.enterRaffle({ value: raffleEntranceFee });
          }
          const startingTimeStamp = await raffle.getLastTimeStamp(); // stores starting timestamp (before we fire our event)

          // performUpkeep (mock being chainlink keepers)
          // fulfillRandomWords (mock begin the chainlink VRF)
          // we will have to wait for the fulfillRandomWords to be called
          // This will be more important for our staging tests...
          await new Promise(async (resolve, reject) => {
            // once the winnerPicked event gets emitted
            // this is a listener
            raffle.once("WinnerPicked", async () => {
              // picked winnerPicked event
              console.log("WinnerPicked event fired!");
              // assert throws an error if it fails, so we need to wrap
              // it in a try/catch so that the promise returns event
              // if it fails.
              try {
                // Now lets get the ending values...
                const recentWinner = await raffle.getRecentWinner();
                console.log(`winner: ${recentWinner}`);
                console.log(accounts[2].address);
                console.log(accounts[0].address);
                console.log(accounts[1].address);
                console.log(accounts[3].address);

                const raffleState = await raffle.getRaffleState();
                const winnerBalance = await ethers.provider.getBalance(
                  accounts[1].address
                );

                const endingTimeStamp = await raffle.getLastTimeStamp();
                const numPlayers = await raffle.getNumberOfPlayers();

                await expect(raffle.getPlayer(0)).to.be.reverted;
                // Comparisons to check if our ending values are correct:
                assert.equal(recentWinner.toString(), accounts[1].address);
                assert.equal(numPlayers.toString(), "0");
                assert.equal(raffleState, 0);
                assert.equal(
                  winnerBalance.toString(),
                  (
                    BigInt(startingBalance) +
                    (BigInt(raffleEntranceFee) * BigInt(additionalEntrances) +
                      BigInt(raffleEntranceFee))
                  ).toString() // startingBalance + ( (raffleEntranceFee * additionalEntrances) + raffleEntranceFee )
                );
                assert(endingTimeStamp > startingTimeStamp);
                resolve(); // if try passes, resolves the promise
              } catch (e) {
                reject(e); // if try fails, rejects the promise
              }
            });

            // kicking off the event by mocking the chainlink keepers and vrf coordinator
            try {
              // performUpkeep (mock being chainlink keepers)
              const tx = await raffle.performUpkeep("0x");
              const txReceipt = await tx.wait(1);
              startingBalance = await ethers.provider.getBalance(
                accounts[1].address
              );
              // fulfillRandomWords (mock begin the chainlink VRF)
              // when this function gets called, this should emit a WinnerPicked event
              await vrfCoordinatorV2Mock.fulfillRandomWords(
                txReceipt.logs[1].args.requestId,
                raffle.target
              );
            } catch (e) {
              reject(e);
            }
          });
        });
      });
    });
