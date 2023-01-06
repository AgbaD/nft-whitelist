const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { PRYTOC_DEVS_NFT_CONTRACT_ADDRESS } = require("../constants");


async function main() {
  const prytocDevNftContract = PRYTOC_DEVS_NFT_CONTRACT_ADDRESS;
  const prytocDevTokenContract = await ethers.getContractFactory("PrytocDevToken");

  const deployedPDTContract = await prytocDevTokenContract.deploy(
    prytocDevNftContract
  );
  await deployedPDTContract.deployed();
  console.log("Prytoc Devs Token Contract Address: ", deployedPDTContract.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });