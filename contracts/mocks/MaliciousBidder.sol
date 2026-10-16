// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../BidBox.sol";

contract MaliciousBidder {
    BidBox public auction;
    bool public hasAttacked;

    constructor(address payable _auction) {
        auction = BidBox(_auction);
    }

    function bid() external payable {
        auction.bid{value: msg.value}();
    }

    function attack() external {
        auction.withdrawRefund();
    }

    // Attempt reentrant call on receiving refund
    receive() external payable {
        if (!hasAttacked) {
            hasAttacked = true;
            // Attempt to re-enter withdrawRefund
            auction.withdrawRefund();
        }
    }
}
