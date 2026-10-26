// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BidBox
 * @notice A simple, secure on-chain auction smart contract for Botchain Mainnet.
 * Allows users to bid on one item using native BOT currency.
 */
contract BidBox {
    // --- State Variables ---
    string public itemName;
    address public immutable creator;
    uint256 public immutable auctionEndTime;

    address public highestBidder;
    uint256 public highestBid;
    uint256 public totalBids;

    bool public ended;
    bool public cancelled;

    // Mapping from bidder address to refundable balance
    mapping(address => uint256) public refunds;

    // Simple reentrancy guard
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // --- Events ---
    event BidPlaced(address indexed bidder, uint256 amount, uint256 timestamp);
    event AuctionEnded(address indexed winner, uint256 amount);
    event AuctionCancelled(uint256 timestamp);
    event RefundWithdrawn(address indexed bidder, uint256 amount);
    event ProceedsWithdrawn(address indexed creator, uint256 amount);

    // --- Modifiers ---
    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    /**
     * @notice Deploy the BidBox auction.
     * @param _itemName Name/description of the item being auctioned.
     * @param _duration Duration of the auction in seconds.
     */
    constructor(string memory _itemName, uint256 _duration) {
        require(bytes(_itemName).length > 0, "Item name cannot be empty");
        require(_duration > 0, "Duration must be greater than zero");

        creator = msg.sender;
        itemName = _itemName;
        auctionEndTime = block.timestamp + _duration;
        _status = _NOT_ENTERED;
    }

    /**
     * @notice Place a bid in native BOT.
     * Must be higher than the current highest bid.
     * Outbid amounts are credited to the previous bidder's refundable balance.
     */
    function bid() external payable nonReentrant {
        require(!cancelled, "Auction has been cancelled");
        require(!ended, "Auction has already ended");
        require(block.timestamp < auctionEndTime, "Auction duration has expired");
        require(msg.sender != creator, "Creator cannot bid on own auction");
        require(msg.value > highestBid, "Bid must be higher than current highest bid");

        // If there was a previous highest bidder, credit their refund
        if (highestBidder != address(0)) {
            refunds[highestBidder] += highestBid;
        }

        highestBidder = msg.sender;
        highestBid = msg.value;
        totalBids += 1;

        emit BidPlaced(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Cancel the auction.
     * Security requirement: Only available before the very first bid is placed.
     */
    function cancelAuction() external nonReentrant {
        require(msg.sender == creator, "Only creator can cancel auction");
        require(!ended, "Auction already ended");
        require(!cancelled, "Auction already cancelled");
        require(highestBidder == address(0), "Cannot cancel after bids have been placed");

        cancelled = true;
        emit AuctionCancelled(block.timestamp);
    }

    /**
     * @notice End the auction after the duration has elapsed.
     */
    function endAuction() external nonReentrant {
        require(msg.sender == creator, "Only creator can end auction");
        require(!ended, "Auction already ended");
        require(!cancelled, "Auction has been cancelled");
        require(block.timestamp >= auctionEndTime, "Auction duration has not expired yet");

        ended = true;
        emit AuctionEnded(highestBidder, highestBid);
    }

    /**
     * @notice Withdraw refundable balance for outbid participants.
     * Also allows winner to recover funds if auction was cancelled.
     * Follows Checks-Effects-Interactions pattern.
     */
    function withdrawRefund() external nonReentrant {
        uint256 refundAmount = refunds[msg.sender];
        refunds[msg.sender] = 0;

        // If cancelled, winner may also withdraw their winning bid
        if (cancelled && msg.sender == highestBidder && highestBid > 0) {
            refundAmount += highestBid;
            highestBid = 0;
        }

        require(refundAmount > 0, "No refundable balance available");

        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");

        emit RefundWithdrawn(msg.sender, refundAmount);
    }

    /**
     * @notice Withdraw auction proceeds.
     * Only creator can withdraw after auction has successfully ended.
     */
    function withdrawProceeds() external nonReentrant {
        require(msg.sender == creator, "Only creator can withdraw proceeds");
        require(ended, "Auction has not ended yet");
        require(!cancelled, "Auction was cancelled");
        require(highestBid > 0, "No winning bid to withdraw");

        uint256 proceeds = highestBid;
        highestBid = 0; // Prevent duplicate withdrawal

        (bool success, ) = payable(creator).call{value: proceeds}("");
        require(success, "Proceeds transfer failed");

        emit ProceedsWithdrawn(creator, proceeds);
    }

    /**
     * @notice Get all auction details in a single call for easy frontend consumption.
     */
    function getAuctionDetails()
        external
        view
        returns (
            string memory _itemName,
            address _creator,
            uint256 _auctionEndTime,
            address _highestBidder,
            uint256 _highestBid,
            uint256 _totalBids,
            bool _ended,
            bool _cancelled,
            uint256 _timeLeft
        )
    {
        uint256 timeLeft = 0;
        if (block.timestamp < auctionEndTime) {
            timeLeft = auctionEndTime - block.timestamp;
        }

        return (
            itemName,
            creator,
            auctionEndTime,
            highestBidder,
            highestBid,
            totalBids,
            ended,
            cancelled,
            timeLeft
        );
    }
}
