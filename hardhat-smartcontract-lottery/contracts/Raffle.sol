// Raffle
// Enter the lottery (paying some amount)
// pick a random winner (verifiably random)， we want this to be untampered(不被篡改) with a bowl
// winner to be selected every X munites -> completly automated
// chainlink oracle -> randomness, automated execution (Chainlink keeper)

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
// we need coordinator of contract, so we need VRFcoordinatorV2interace
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

error Raffle_NotEnoughETHEntered();
error Raffle_TransferFailed();
error Raffle_NotOpen();
error Raffle_UpkeepNotNeeded(
    uint256 currentBalance,
    uint256 numPlayers,
    uint256 raffeState
);

/**
 * @title a simple Raffle contract
 * @author C.C
 * @notice This contract is for creating an untamperable decentralized smart contract
 * @dev this implements Chainlink VRF v2 and Chainlink automation
 */

// inheritance from VRFConsumerBaseV2 contract to ovveride the fulfill function
contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
    /* Type declarations*/
    enum RaffleState {
        OPEN,
        CALCULATING
    } // its like uint256 0 = OPEN, 1 = CALCULATING

    /* State Variables */
    uint256 private immutable i_entranceFee;
    // make address payable, so we can pay player who wins
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionID;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private constant NUM_WORDS = 1;

    // Lottery variables
    address private s_recentWinner;
    RaffleState private s_raffle_State;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    // Events
    // naming convintion is: name a event by reverse the function name
    event RaffleEnter(address indexed player);
    event RequestedRafflewinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    // after the iinheritance, we should initialize VRFConsumerBaseV2 too
    // and give it the coordinator
    // coordinator is the address of the contract that we deploy, that does the random number verification
    constructor(
        address vrfCoordinatorV2, // contract, so we need to deploy a mocks
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionID,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionID = subscriptionID;
        i_callbackGasLimit = callbackGasLimit;
        // we can also explain this like RaffleState(0)
        s_raffle_State = RaffleState.OPEN;
        // last timestamp
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    function getEntraceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffle_State;
    }

    // it's pure, because its equal to return 1;
    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getRequestConfirmation() public pure returns (uint16) {
        return REQUEST_CONFIRMATIONS;
    }

    function enterRaffle() public payable {
        // require msg.value > i_entraceFee
        if (msg.value < i_entranceFee) {
            revert Raffle_NotEnoughETHEntered();
        }
        if (s_raffle_State != RaffleState.OPEN) {
            revert Raffle_NotOpen();
        }
        // push players into a payable array
        s_players.push(payable(msg.sender));
        // Event: Whenver we update a dynamic array/mapping, we always want to emit a event
        emit RaffleEnter((msg.sender));
    }

    /**
     * Check if it's time for us to get a random number to update the recent winner
     * and send them all the funds/
     * checkData: allow us to specify anything that we want, when we call this checkUpKeep function
     * have this checkData begin type bytes, means that we can even specify this to call other functions
     * it means it can perform complex calculations off-chain and then send the result to performUpkeep as performData
     * this is the function that Chainlink keeper nodes call they look for `upkeepData` to be true.
     * The following should be true in order to return true:
     * 1. Our time interval should have passed
     * 2. the lottery should have at least 1 player, and have some ETH
     * 3. Our subscription is funded with LINK
     * 4. the lottery should be in an "open" state
     * when all the condition is sadisifieded, it will return true and send result to let performUpkeep to be executed.
     */
    function checkUpkeep(
        bytes memory /*checkData*/ // performData is something we can use, if we want checkUpkeep do some extra stuff
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory /*performData */)
    {
        bool isOpen = (RaffleState.OPEN == s_raffle_State);
        bool timePassed = (block.timestamp - s_lastTimeStamp) > i_interval;
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = address(this).balance > 0;
        // if this returns true, it's time to request a new winner
        upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
    }

    // will automatically run when checkUpkeep returns true
    // This function is called by the chainlink keepers network so that
    // this can automatically run without us to interact with it
    // external function are a little bit cheaper than public functions
    // because solidity knows we can call it by our own contract
    function performUpkeep(bytes calldata /* performData */) external override {
        // Request the random number
        // Once we get it, do something with it
        // Chainlink VRF: 2 transaction process,
        // have a random number in 2 transaction is much better than have it in one
        // if it's only one trasaction, people can brutal force to simulating calling this trasaction
        // and will learn how to simulate this call soon
        // simulate calling these transaction see what they can manipulate to make sure that they are the winner
        // the requestRandomWinner function will actually request it
        // and then in a second function the random number is going to be returned and in the transaction
        // that we actually get the random number from the chainLink network, that's when we are going to send money
        // to the winner.

        (bool upkeepNeeded, ) = checkUpkeep(" ");
        if (!upkeepNeeded) {
            revert Raffle_UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_raffle_State)
            );
        }
        s_raffle_State = RaffleState.CALCULATING;

        // Will revert if subscription is not set and funded.
        // returns a request ID, a uniqueID that defines who is requesting this and all this other
        // information
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane, // gas lane: the maximum gas price you are willing to pay for a request
            i_subscriptionID, // contract uses for funding request
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit, // set the limit for how much computation are fulfilled random words can be
            NUM_WORDS
        );

        emit RequestedRafflewinner(requestId);
    }

    // fulfill = 实现
    function fulfillRandomWords(
        uint256 /*requestId*/, // this tell the function, we know you need a uint256, but we're not going to use requestId
        uint256[] memory randomWords
    ) internal override {
        // pick a random winner using something called the module function
        // example: s_players size = 10, randomNumber = 202, we do the module: 202 % 10 = 2,
        // 10*20 = 200, 202 - 200 = 2, 2 is winner
        uint indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_raffle_State = RaffleState.OPEN;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Raffle_TransferFailed();
        }
        emit WinnerPicked(recentWinner);
    }
}
