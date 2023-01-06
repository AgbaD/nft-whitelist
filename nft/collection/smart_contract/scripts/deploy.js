const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants");

async function main() {
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;
  const metadataURL = METADATA_URL;

  const nftContract = await ethers.getContractFactory("PrytocDevs");
  const deployedNftContract = await nftContract.deploy(
    metadataURL,
    whitelistContract
  );
  await deployedNftContract.deployed();
  console.log("Prytoc Devs Contract Address:", deployedNftContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });