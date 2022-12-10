const fs = require('fs');
const { ethers } = require('hardhat');
async function main() {
  const [deployer, user1] = await ethers.getSigners();
  // We get the contract factory to deploy
  const BlockchaintwitterFactory = await ethers.getContractFactory("Blockchaintwitter");
  // Deploy contract
  const blockchaintwitter = await BlockchaintwitterFactory.deploy();
  // Save contract address file in project
  const contractsDir = __dirname + "/../src/contractsData";
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/blockchaintwitter-address.json`,
    JSON.stringify({ address: blockchaintwitter.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync("Blockchaintwitter");

  fs.writeFileSync(
    contractsDir + `/blockchaintwitter.json`,
    JSON.stringify(contractArtifact, null, 2)
  );
  console.log("Blockchaintwitter deployed to:", blockchaintwitter.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
