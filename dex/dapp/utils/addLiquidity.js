import { Contract, utils } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";


export const addLiquidity = async (
    signer,
    addPDAmountWei,
    addEtherAmountWei
) => {
    try {
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            signer
        )
        const tokenContract = new Contract(
            TOKEN_CONTRACT_ADDRESS,
            TOKEN_CONTRACT_ABI,
            signer
        )
    
        let tx = await tokenContract.approve(
            EXCHANGE_CONTRACT_ADDRESS,
            addPDAmountWei.toString()
        )
        await tx.wait();
        tx = await exchangeContract.addLiquidity(
            addPDAmountWei, {value: addEtherAmountWei}
        )
        await tx.wait();
    } catch (error) {
        console.error(error);
    }
}

export const calculatePD = async (
    _addEther = "0",
    etherBalanceContract,
    pdTokenReserve
) => {
    const _addEtherAmountWei = utils.parseEther(_addEther);

    const pdAmount = _addEtherAmountWei.mul(pdTokenReserve).div(etherBalanceContract);
    return pdAmount;
}
