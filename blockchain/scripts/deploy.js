const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying ArtProvenanceNFT contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const ArtProvenanceNFT = await hre.ethers.getContractFactory("ArtProvenanceNFT");
  const contract = await ArtProvenanceNFT.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("ArtProvenanceNFT deployed successfully to:", contractAddress);

  // Read Artifact ABI
  const artifactPath = path.join(__dirname, "../artifacts/contracts/ArtProvenanceNFT.sol/ArtProvenanceNFT.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const deploymentData = {
    address: contractAddress,
    deployer: deployer.address,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  // Save to blockchain folder
  const blockchainOut = path.join(__dirname, "../deployed_contract.json");
  fs.writeFileSync(blockchainOut, JSON.stringify(deploymentData, null, 2));
  console.log("Wrote deployment data to:", blockchainOut);

  // Save copy to backend data folder
  const backendDir = path.join(__dirname, "../../backend/data");
  if (fs.existsSync(backendDir)) {
    const backendOut = path.join(backendDir, "deployed_contract.json");
    fs.writeFileSync(backendOut, JSON.stringify(deploymentData, null, 2));
    console.log("Synchronized to backend data at:", backendOut);
  }

  // Save copy to frontend src folder if exists
  const frontendDir = path.join(__dirname, "../../frontend/src/contracts");
  if (fs.existsSync(path.dirname(frontendDir))) {
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
    }
    const frontendOut = path.join(frontendDir, "deployed_contract.json");
    fs.writeFileSync(frontendOut, JSON.stringify(deploymentData, null, 2));
    console.log("Synchronized to frontend src at:", frontendOut);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
