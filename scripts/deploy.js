const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("----------------------------------------------------");
  console.log("Deploying BidBox contract with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "BOT");

  // Auction parameters
  const itemName = process.env.AUCTION_ITEM_NAME || "Botchain Pioneer Pass #001";
  // Default duration: 3 days (259200 seconds) or from env
  const durationInSeconds = process.env.AUCTION_DURATION_SECONDS
    ? parseInt(process.env.AUCTION_DURATION_SECONDS)
    : 3 * 24 * 60 * 60; // 3 days

  console.log(`Item Name: "${itemName}"`);
  console.log(`Duration: ${durationInSeconds} seconds (${durationInSeconds / 3600} hours)`);

  const BidBox = await hre.ethers.getContractFactory("BidBox");
  const auction = await BidBox.deploy(itemName, durationInSeconds);
  await auction.waitForDeployment();

  const contractAddress = await auction.getAddress();
  console.log("----------------------------------------------------");
  console.log("BidBox deployed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("Item Name:       ", itemName);
  console.log("Creator:         ", deployer.address);
  console.log("Auction End Time:", new Date(Date.now() + durationInSeconds * 1000).toUTCString());
  console.log("Explorer:        ", `https://scan.bohr.life/address/${contractAddress}`);
  console.log("----------------------------------------------------");

  // Write deployment output to contracts-config.json for frontend integration
  const deploymentInfo = {
    address: contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 968,
    itemName: itemName,
    creator: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const outputDir = path.join(__dirname, "../frontend/src/config");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "contract-address.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Saved deployment configuration to:", outputPath);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
