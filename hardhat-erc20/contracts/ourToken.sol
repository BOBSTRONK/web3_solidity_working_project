// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ourToken is ERC20 {
    // TO order to inheritance the ERC20 token, we should implment the constructor
    // initialSupply should be e18, becuase if we pass 50, it will be only 50 wei, we need more
    // ERC20() is calling ERC20 constructor
    constructor(uint256 initialSupply) ERC20("ourToken", "OT") {
        // function that allows us to create initial amount of tokens
        // and who owns these tokens
        _mint(msg.sender, initialSupply);
        // without _mint function, we will not have any token
    }
}
