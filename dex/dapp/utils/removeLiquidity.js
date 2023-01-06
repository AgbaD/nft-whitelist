import { Contract, providers, utils, BigNumber } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
} from "../constants";

export const removeLiquidity = async (signer, removeLPTokensWei) => {
    try {
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            signer
        )
        const tx = await exchangeContract.removeLiquidity(removeLPTokensWei);
        await tx.wait();
    } catch (error) {
        console.error(error);
    }
}

export const getTokenAfterRemove = async (
    provider,
    removeLPTokenWei,
    _ethBalance,
    prytocDevTokenReserve
) => {
    try {
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        )
        const _totalSupply = await exchangeContract.totalSupply();
        const _removeEther = _ethBalance.mul(removeLPTokenWei).div(_totalSupply);
        const _removePD = prytocDevTokenReserve.mul(removeLPTokenWei).div(_totalSupply);
        return {_removeEther, _removePD,}
    } catch (error) {
        console.error(error);
    }
}

