// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MYToken is ERC20 {
    uint256 public constant initalSupply = 2000000000;

    constructor() ERC20("My Token", "MT") {
        _mint(msg.sender, initalSupply * 10**18);
    }

    function burnToken(uint256 burnAmount) external {
        _burn(msg.sender, burnAmount);
    }

    // function totalSupply() public view virtual override returns (uint256) {
    //     return initalSupply;
    // }
}
