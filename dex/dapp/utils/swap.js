import { Contract, utils } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

export const getAmountOfTokenReceivedFromSwap = async (
    _swapAmountWei,
    provider,
    ethSelected,
    ethBalance,
    reservedPD
) => {
    try {
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        )
        let amountOfTokens;
        if (ethSelected) {
            amountOfTokens = await exchangeContract.getAmountOfTokens(
                _swapAmountWei, ethBalance, 
                reservedPD
            );
        } else {
            amountOfTokens = await exchangeContract.getAmountOfTokens(
                _swapAmountWei, reservedPD,
                ethBalance
            )
        }
        return amountOfTokens;
    } catch (error) {
        console.error(error);
    }
}

export const swapTokens = async (
    signer,
    swapAmountWei,
    tokenToBeReceivedAfterSwap,
    ethSelected
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
        let tx;
        if (ethSelected) {
            tx = await exchangeContract.ethToPrytocDevToken(
                tokenToBeReceivedAfterSwap, {
                    value: swapAmountWei
                }
            )
        } else {
            tx = await tokenContract.approve(
                EXCHANGE_CONTRACT_ADDRESS,
                swapAmountWei.toString()
            )
            await tx.wait();
            tx = await exchangeContract.prytocDevTokenToEth(
                swapAmountWei,
                tokenToBeReceivedAfterSwap
            )
        }
        await tx.wait();
    } catch (error) {
        console.error(error);
    }
}

