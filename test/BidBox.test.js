const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BidBox Auction Smart Contract", function () {
  let BidBox;
  let auction;
  let MaliciousBidder;
  let creator, bidder1, bidder2, bidder3, stranger;
  const ITEM_NAME = "Botchain Genesis Pass";
  const DURATION = 3600; // 1 hour in seconds

  beforeEach(async function () {
    [creator, bidder1, bidder2, bidder3, stranger] = await ethers.getSigners();

    BidBox = await ethers.getContractFactory("BidBox");
    auction = await BidBox.deploy(ITEM_NAME, DURATION);
    await auction.waitForDeployment();

    MaliciousBidder = await ethers.getContractFactory("MaliciousBidder");
  });

  describe("Deployment & Initialization", function () {
    it("Should initialize auction with correct parameters", async function () {
      expect(await auction.itemName()).to.equal(ITEM_NAME);
      expect(await auction.creator()).to.equal(creator.address);
      expect(await auction.highestBidder()).to.equal(ethers.ZeroAddress);
      expect(await auction.highestBid()).to.equal(0);
      expect(await auction.totalBids()).to.equal(0);
      expect(await auction.ended()).to.equal(false);
      expect(await auction.cancelled()).to.equal(false);

      const latestTime = await time.latest();
      const endTime = await auction.auctionEndTime();
      expect(endTime).to.be.closeTo(BigInt(latestTime + DURATION), 5n);
    });

    it("Should reject deployment with empty item name or zero duration", async function () {
      await expect(BidBox.deploy("", DURATION)).to.be.revertedWith("Item name cannot be empty");
      await expect(BidBox.deploy("Test Item", 0)).to.be.revertedWith("Duration must be greater than zero");
    });

    it("Should return accurate details via getAuctionDetails()", async function () {
      const details = await auction.getAuctionDetails();
      expect(details._itemName).to.equal(ITEM_NAME);
      expect(details._creator).to.equal(creator.address);
      expect(details._highestBidder).to.equal(ethers.ZeroAddress);
      expect(details._highestBid).to.equal(0);
      expect(details._totalBids).to.equal(0);
      expect(details._ended).to.equal(false);
      expect(details._cancelled).to.equal(false);
      expect(details._timeLeft).to.be.greaterThan(0);
    });
  });

  describe("Bidding Logic", function () {
    it("Should allow a user to place a successful bid and emit BidPlaced", async function () {
      const bidAmount = ethers.parseEther("1.0");

      await expect(auction.connect(bidder1).bid({ value: bidAmount }))
        .to.emit(auction, "BidPlaced")
        .withArgs(bidder1.address, bidAmount, (val) => val > 0);

      expect(await auction.highestBidder()).to.equal(bidder1.address);
      expect(await auction.highestBid()).to.equal(bidAmount);
      expect(await auction.totalBids()).to.equal(1);
    });

    it("Should reject bids that are too low (equal or less than current highest bid)", async function () {
      const bidAmount1 = ethers.parseEther("2.0");
      await auction.connect(bidder1).bid({ value: bidAmount1 });

      // Equal bid should be rejected
      await expect(
        auction.connect(bidder2).bid({ value: bidAmount1 })
      ).to.be.revertedWith("Bid must be higher than current highest bid");

      // Lower bid should be rejected
      await expect(
        auction.connect(bidder2).bid({ value: ethers.parseEther("1.5") })
      ).to.be.revertedWith("Bid must be higher than current highest bid");

      // Zero bid on fresh auction should be rejected
      const freshAuction = await BidBox.deploy("Item", DURATION);
      await expect(
        freshAuction.connect(bidder1).bid({ value: 0 })
      ).to.be.revertedWith("Bid must be higher than current highest bid");
    });

    it("Should reject bids from the creator", async function () {
      await expect(
        auction.connect(creator).bid({ value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Creator cannot bid on own auction");
    });

    it("Should reject bids after the auction duration has expired", async function () {
      await time.increase(DURATION + 1);

      await expect(
        auction.connect(bidder1).bid({ value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Auction duration has expired");
    });

    it("Should reject bids if the auction is already ended", async function () {
      await auction.connect(bidder1).bid({ value: ethers.parseEther("1.0") });
      await time.increase(DURATION + 1);
      await auction.connect(creator).endAuction();

      await expect(
        auction.connect(bidder2).bid({ value: ethers.parseEther("2.0") })
      ).to.be.revertedWith("Auction has already ended");
    });

    it("Should reject bids if the auction is cancelled", async function () {
      await auction.connect(creator).cancelAuction();

      await expect(
        auction.connect(bidder1).bid({ value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Auction has been cancelled");
    });
  });

  describe("Refund Accounting & Withdrawals", function () {
    it("Should correctly record refunds when another user is outbid", async function () {
      const bid1 = ethers.parseEther("1.0");
      const bid2 = ethers.parseEther("2.5");
      const bid3 = ethers.parseEther("4.0");

      await auction.connect(bidder1).bid({ value: bid1 });
      expect(await auction.refunds(bidder1.address)).to.equal(0);

      // Bidder2 outbids bidder1
      await auction.connect(bidder2).bid({ value: bid2 });
      expect(await auction.refunds(bidder1.address)).to.equal(bid1);
      expect(await auction.refunds(bidder2.address)).to.equal(0);

      // Bidder3 outbids bidder2
      await auction.connect(bidder3).bid({ value: bid3 });
      expect(await auction.refunds(bidder1.address)).to.equal(bid1);
      expect(await auction.refunds(bidder2.address)).to.equal(bid2);
    });

    it("Should allow outbid bidders to safely withdraw their refunds", async function () {
      const bid1 = ethers.parseEther("1.0");
      const bid2 = ethers.parseEther("2.0");

      await auction.connect(bidder1).bid({ value: bid1 });
      await auction.connect(bidder2).bid({ value: bid2 });

      expect(await auction.refunds(bidder1.address)).to.equal(bid1);

      const balBefore = await ethers.provider.getBalance(bidder1.address);
      const tx = await auction.connect(bidder1).withdrawRefund();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await ethers.provider.getBalance(bidder1.address);

      expect(balAfter).to.equal(balBefore + bid1 - gasCost);
      expect(await auction.refunds(bidder1.address)).to.equal(0);

      await expect(tx)
        .to.emit(auction, "RefundWithdrawn")
        .withArgs(bidder1.address, bid1);
    });

    it("Should reject refund withdrawal if user has no refundable balance", async function () {
      await expect(
        auction.connect(stranger).withdrawRefund()
      ).to.be.revertedWith("No refundable balance available");
    });

    it("Should prevent highest bidder from withdrawing their winning bid while auction is active or won", async function () {
      const bid1 = ethers.parseEther("1.0");
      await auction.connect(bidder1).bid({ value: bid1 });

      // While active
      await expect(
        auction.connect(bidder1).withdrawRefund()
      ).to.be.revertedWith("No refundable balance available");

      // After auction ended successfully
      await time.increase(DURATION + 1);
      await auction.connect(creator).endAuction();

      await expect(
        auction.connect(bidder1).withdrawRefund()
      ).to.be.revertedWith("No refundable balance available");
    });
  });

  describe("Auction Cancellation", function () {
    it("Should allow creator to cancel auction before any bids are placed", async function () {
      await expect(auction.connect(creator).cancelAuction())
        .to.emit(auction, "AuctionCancelled")
        .withArgs((val) => val > 0);

      expect(await auction.cancelled()).to.equal(true);
    });

    it("Should prevent non-creators from cancelling the auction", async function () {
      await expect(
        auction.connect(stranger).cancelAuction()
      ).to.be.revertedWith("Only creator can cancel auction");
    });

    it("Should prevent cancellation after the first bid has been placed", async function () {
      await auction.connect(bidder1).bid({ value: ethers.parseEther("1.0") });

      await expect(
        auction.connect(creator).cancelAuction()
      ).to.be.revertedWith("Cannot cancel after bids have been placed");
    });

    it("Should prevent cancelling an auction twice", async function () {
      await auction.connect(creator).cancelAuction();
      await expect(
        auction.connect(creator).cancelAuction()
      ).to.be.revertedWith("Auction already cancelled");
    });
  });

  describe("Auction Ending & Creator Proceeds", function () {
    it("Should allow creator to end auction after duration expires", async function () {
      const bidAmount = ethers.parseEther("3.0");
      await auction.connect(bidder1).bid({ value: bidAmount });

      await time.increase(DURATION + 1);

      await expect(auction.connect(creator).endAuction())
        .to.emit(auction, "AuctionEnded")
        .withArgs(bidder1.address, bidAmount);

      expect(await auction.ended()).to.equal(true);
    });

    it("Should reject ending auction before duration expires", async function () {
      await expect(
        auction.connect(creator).endAuction()
      ).to.be.revertedWith("Auction duration has not expired yet");
    });

    it("Should reject ending auction by non-creator", async function () {
      await time.increase(DURATION + 1);
      await expect(
        auction.connect(stranger).endAuction()
      ).to.be.revertedWith("Only creator can end auction");
    });

    it("Should reject ending an auction that is already ended or cancelled", async function () {
      await time.increase(DURATION + 1);
      await auction.connect(creator).endAuction();

      await expect(
        auction.connect(creator).endAuction()
      ).to.be.revertedWith("Auction already ended");

      // Cancelled auction
      const freshAuction = await BidBox.deploy("Item", DURATION);
      await freshAuction.connect(creator).cancelAuction();
      await time.increase(DURATION + 1);
      await expect(
        freshAuction.connect(creator).endAuction()
      ).to.be.revertedWith("Auction has been cancelled");
    });

    it("Should allow creator to withdraw winning proceeds after auction ends", async function () {
      const winningBid = ethers.parseEther("5.0");
      await auction.connect(bidder1).bid({ value: winningBid });

      await time.increase(DURATION + 1);
      await auction.connect(creator).endAuction();

      const balBefore = await ethers.provider.getBalance(creator.address);
      const tx = await auction.connect(creator).withdrawProceeds();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await ethers.provider.getBalance(creator.address);

      expect(balAfter).to.equal(balBefore + winningBid - gasCost);

      await expect(tx)
        .to.emit(auction, "ProceedsWithdrawn")
        .withArgs(creator.address, winningBid);

      // Prevent duplicate withdrawal
      await expect(
        auction.connect(creator).withdrawProceeds()
      ).to.be.revertedWith("No winning bid to withdraw");
    });

    it("Should prevent non-creator from withdrawing proceeds", async function () {
      const winningBid = ethers.parseEther("2.0");
      await auction.connect(bidder1).bid({ value: winningBid });
      await time.increase(DURATION + 1);
      await auction.connect(creator).endAuction();

      await expect(
        auction.connect(bidder1).withdrawProceeds()
      ).to.be.revertedWith("Only creator can withdraw proceeds");
    });

    it("Should prevent creator from withdrawing proceeds before auction ends", async function () {
      await auction.connect(bidder1).bid({ value: ethers.parseEther("1.0") });

      await expect(
        auction.connect(creator).withdrawProceeds()
      ).to.be.revertedWith("Auction has not ended yet");
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should block reentrancy attack on withdrawRefund()", async function () {
      const auctionAddress = await auction.getAddress();
      const attacker = await MaliciousBidder.deploy(auctionAddress);
      await attacker.waitForDeployment();
      const attackerAddress = await attacker.getAddress();

      // Attacker places a 1 ETH bid
      await attacker.bid({ value: ethers.parseEther("1.0") });

      // Bidder1 outbids attacker with 2 ETH, making attacker eligible for refund
      await auction.connect(bidder1).bid({ value: ethers.parseEther("2.0") });
      expect(await auction.refunds(attackerAddress)).to.equal(ethers.parseEther("1.0"));

      // When attacker calls attack(), the contract's receive() hook attempts to re-enter
      // Reentrancy guard causes the nested call to revert, so the top-level call safely fails
      await expect(attacker.attack()).to.be.revertedWith("Refund transfer failed");

      // Balance in refunds is still safe
      expect(await auction.refunds(attackerAddress)).to.equal(ethers.parseEther("1.0"));
    });
  });
});
