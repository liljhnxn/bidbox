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

  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  const explorerBase = "https://scan.botchain.ai";

  // Check and optimize gas fee
  const feeData = await hre.ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || 20000000000n; // Use network standard gasPrice (20 Gwei) without extra padding
  console.log("Network Gas Price:", hre.ethers.formatUnits(gasPrice, "gwei"), "Gwei");

  const BidBox = await hre.ethers.getContractFactory("BidBox");
  const deployTx = await BidBox.getDeployTransaction(itemName, durationInSeconds);
  const estimatedGas = await hre.ethers.provider.estimateGas(deployTx);
  const estimatedCost = estimatedGas * gasPrice;
  console.log(`Estimated Deployment Gas: ${estimatedGas.toString()}`);
  console.log(`Estimated Cost: ~${hre.ethers.formatEther(estimatedCost)} BOT`);

  if (balance < estimatedCost) {
    throw new Error(`Insufficient funds: balance is ${hre.ethers.formatEther(balance)} BOT, but required ~${hre.ethers.formatEther(estimatedCost)} BOT`);
  }

  console.log("Submitting deployment transaction with optimized gas fee...");
  const auction = await BidBox.deploy(itemName, durationInSeconds, {
    gasPrice: gasPrice,
  });
  await auction.waitForDeployment();

  const contractAddress = await auction.getAddress();
  const deploymentTx = auction.deploymentTransaction();
  const receipt = await deploymentTx.wait();
  const actualGasUsed = receipt ? receipt.gasUsed : estimatedGas;
  const actualCost = actualGasUsed * (receipt ? receipt.gasPrice || gasPrice : gasPrice);

  console.log("----------------------------------------------------");
  console.log("BidBox deployed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("Actual Gas Used: ", actualGasUsed.toString());
  console.log("Actual Cost:     ", hre.ethers.formatEther(actualCost), "BOT");
  console.log("Item Name:       ", itemName);
  console.log("Creator:         ", deployer.address);
  console.log("Auction End Time:", new Date(Date.now() + durationInSeconds * 1000).toUTCString());
  console.log("Explorer:        ", `${explorerBase}/address/${contractAddress}`);
  console.log("----------------------------------------------------");

  // Write deployment output to contracts-config.json for frontend integration
  const deploymentInfo = {
    address: contractAddress,
    network: hre.network.name,
    chainId: Number(chainId),
    itemName: itemName,
    creator: deployer.address,
    explorer: `${explorerBase}/address/${contractAddress}`,
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
