const { ethers } = require("hardhat");
const { PRYTOCDEVS_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main() {
  // deploy fake nft marketplace
  const fakeNftMarketPlace = await ethers.getContractFactory(
    "FakeNFTMarketplace"
  )

  const fakeNFTMarketplace = await fakeNftMarketPlace.deploy();
  await fakeNFTMarketplace.deployed();
  console.log("FakeNFTMarketPlace CA: ", fakeNFTMarketplace.address)

  // deploy dao
  const PrytocDevsDAO = await ethers.getContractFactory(
    "PrytocDevsDAO"
  )
  const prytocDevsDAO = await PrytocDevsDAO.deploy(
    fakeNFTMarketplace.address,
    PRYTOCDEVS_NFT_CONTRACT_ADDRESS,
    {
      value: ethers.utils.parseEther("0.13")
    }
  );
  await prytocDevsDAO.deployed();
  console.log("Prytoc Devs DAO CA: ", prytocDevsDAO.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });