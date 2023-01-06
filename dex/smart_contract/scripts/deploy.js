const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { PRYTOC_DEV_TOKEN_CONTRACT_ADDRESS } = require("../constants");

async function main() {
  const prytocDevTokenAddress = PRYTOC_DEV_TOKEN_CONTRACT_ADDRESS;
  const exchangeContract = await ethers.getContractFactory("Exchange");
  const deployedExchangeContract = await exchangeContract.deploy(
    prytocDevTokenAddress
  )
  await deployedExchangeContract.deployed()
  console.log("Exchange Contact Address: ", deployedExchangeContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });