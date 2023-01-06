import { Contract } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

/**
 * getEtherBalance: Retrieves the ether balance of the user or the contract
 */
export const getEtherBalance = async (provider, address, contract = false) => {
    try {
        if (contract) {
            const balance = await provider.getBalance(EXCHANGE_CONTRACT_ADDRESS);
            return balance;
        } else {
            const balance = await provider.getBalance(address);
            return balance;
        }
    } catch (error) {
        console.error(error);
        return 0;
    }
}

export const getPDTokensBalance = async (provider, address) => {
    try {
        const prytocDevTokenContract = new Contract(
            TOKEN_CONTRACT_ADDRESS,
            TOKEN_CONTRACT_ABI,
            provider
        )
        const balance = await prytocDevTokenContract.balanceOf(address);
        return balance;
    } catch (error) {
        console.error(error);
    }
}

export const getLPTokensBalance = async(provider, address) => {
    try {
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        )
        const balance = await exchangeContract.balanceOf(address);
        return balance;
    } catch (error) {
        console.error(error);
    }
}

/**
 * getReserveOfPDTokens: Retrieves the amount of PD tokens in the
 * exchange contract address
 */
export const getReserveOfPDTokens = async (provider) => {
    try {
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        )
        const reserve = await exchangeContract.getReserve();
        return reserve;
    } catch (error) {
        console.error(error);
    }
}


