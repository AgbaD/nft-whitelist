// SPDX-License-Identifier: MIT License
pragma solidity ^0.8.0;

contract Whitelist {
    uint public maxWhitelistedAddresses;
    uint public numAddressesWhitelisted;
    mapping(address => bool) public whitelistedAddresses;

    constructor(uint _maxWhitelistedAddresses) {
        maxWhitelistedAddresses = _maxWhitelistedAddresses;
    }

    function addAddressToWhitelist() public {
        require(!whitelistedAddresses[msg.sender], "Sender has already been whitelisted!");
        require(maxWhitelistedAddresses > numAddressesWhitelisted, "More addresses cant be added, limit reached");
        whitelistedAddresses[msg.sender] = true;
        numAddressesWhitelisted += 1;
    }
}
