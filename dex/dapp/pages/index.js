import { BigNumber, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { addLiquidity, calculatePD } from "../utils/addLiquidity";
import {
  getPDTokensBalance,
  getEtherBalance,
  getLPTokensBalance,
  getReserveOfPDTokens,
} from "../utils/getAmounts";
import {
  getTokenAfterRemove,
  removeLiquidity,
} from "../utils/removeLiquidity";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "../utils/swap";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const web3ModalRef = useRef();
  const zero = BigNumber.from(0);

  // if true, user is on liquidity tab else, swap tab
  const [liquidityTab, setLiquidityTab] = useState(true);
  // user ETH balance
  const [etherBalance, setEtherBalance] = useState(zero);
  // user PD Token Balance
  const [pdBalance, setPDBalance] = useState(zero);
  // user LP Token balance
  const [lpBalance, setLPBalance] = useState(zero);
  // exchange PD Token balance
  const [reservedPD, setReservedPD] = useState(zero);
  // exchange ETH balance
  const [etherBalanceContract, setEtherBalanceContract] = useState(zero);

  // amount of Ether that the user wants to add to the liquidity
  const [addEther, setAddEther] = useState(zero);
  // amount of PD tokens that the user wants to add to the liquidity or 
  // PD tokens that the user can add given a certain amount of ether
  const [addPDTokens, setAddPDTokens] = useState(zero);
  // amount of ETH to be sent to user based on a certain number of `LP` tokens
  const [removeEther, setRemoveEther] = useState(zero);
  // amount of PD Token to be sent to user based on a certain number of `LP` tokens
  const [removePD, setRemovePD] = useState(zero);
  // amount of LP tokens that the user wants to remove from liquidity
  const [removeLPTokens, setRemoveLPTokens] = useState("0");

  
  // Amount that the user wants to swap
  const [swapAmount, setSwapAmount] = useState("");
  // number of corresponding tokens to be received after swap
  const [tokenToBeReceivedAfterSwap, setTokenToBeReceivedAfterSwap] =
    useState(zero);
  // check to see if user is swapping from ETH or not
  const [ethSelected, setEthSelected] = useState(true);


  const getAmounts = async () => {
    try {
      const provider = await getProviderOrSigner();
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();

      const _etherBalanceContract = await getEtherBalance(provider, null, true);
      const _etherBalance = await getEtherBalance(provider, address);
      const _pdBalance = await getPDTokensBalance(provider, address);
      const _lpBalance = await getLPTokensBalance(provider, address);
      const _reservedPD = await getReserveOfPDTokens(provider);
      setReservedPD(_reservedPD);
      setLPBalance(_lpBalance);
      setPDBalance(_pdBalance);
      setEtherBalance(_etherBalance);
      setEtherBalanceContract(_etherBalanceContract);

    } catch (error) {
      console.error(error);
    }
  }

  const _swapTokens = async () => {
    try {
      const swapAmountWei = utils.parseEther(swapAmount);
      if (!swapAmountWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        await swapTokens(
          signer, swapAmountWei,
          tokenToBeReceivedAfterSwap, ethSelected
        )
        setLoading(false);
        await getAmounts();
        setSwapAmount("");
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      setSwapAmount("");
    }
  }

  const _getAmountOfTokensReceivedFromSwap = async () => {
    try {
      const swapAmountWei = utils.parseEther(swapAmount.toString());
      if (!swapAmountWei.eq(zero)) {
        const provider = await getProviderOrSigner()
        const ethBalance = await getEtherBalance(provider, null, true)
        const amountOfTokens = await getAmountOfTokensReceivedFromSwap(
          swapAmountWei,
          provider,
          ethSelected,
          ethBalance,
          reservedPD
        )
        setTokenToBeReceivedAfterSwap(amountOfTokens);
      } else {
        setTokenToBeReceivedAfterSwap(zero);
      }
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const _addLiquidity = async () => {
    try {
      const addEtherWei = utils.parseEther(addEther.toString());
      if (!addPDTokens.eq(zero) && !addEtherWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        await addLiquidity(
          signer,
          addPDTokens,
          addEtherWei
        )
        setLoading(false);
        setAddPDTokens(zero);
        await getAmounts();
      } else {
        setAddPDTokens(zero)
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      setAddPDTokens(zero);
    }
  }

  const _removeLiquidity = async () => {
    try {
      const removeLPTokensWei = utils.parseEther(removeLPTokens);
      const signer = await getProviderOrSigner(true);
      setLoading(true);
      await removeLiquidity(signer, removeLPTokensWei);
      setLoading(false);
      await getAmounts();
      setRemovePD(zero);
      setRemoveEther(zero)
    } catch (error) {
      console.error(error);
      setLoading(false);
      setRemoveEther(zero);
      setRemovePD(zero);
    }
  }

  const _getTokensAfterRemove = async (_removeLPTokens) => {
    try {
      const provider = await getProviderOrSigner();
      const removeLPTokensWei = utils.parseEther(_removeLPTokens);
      const _ethBalance = await getEtherBalance(provider, null, true)
      const pdTokenReserve = await getReserveOfPDTokens(provider);
      const {_removeEther, _removePD } = await getTokenAfterRemove(
        provider, removeLPTokensWei,
        _ethBalance, pdTokenReserve
      )
      setRemoveEther(_removeEther);
      setRemovePD(_removePD);
    } catch (error) {
      console.error(error)
    }
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error)
    }
  }

  const getProviderOrSigner = async (needSigner=false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 80001) {
      window.alert("Change the network to Polygon Mumbai");
      throw new Error("Change network to Polygon Mumbai");
    }

    if(needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider
  }

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "mumbai",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getAmounts();
    }
  }, [walletConnected]);


  const renderButton = () => {
    // If wallet is not connected, return a button which allows them to connect their wllet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    // If we are currently waiting for something, return a loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    if (liquidityTab) {
      return (
        <div>
          <div className={styles.description}>
            You have:
            <br />
            {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
            {utils.formatEther(pdBalance)} Prytoc Dev Tokens
            <br />
            {utils.formatEther(etherBalance)} Ether
            <br />
            {utils.formatEther(lpBalance)} Prytoc Dev LP tokens
          </div>
          <div>
            {/* If reserved CD is zero, render the state for liquidity zero where we ask the user
            how much initial liquidity he wants to add else just render the state where liquidity is not zero and
            we calculate based on the `Eth` amount specified by the user how much `CD` tokens can be added */}
            {utils.parseEther(reservedPD.toString()).eq(zero) ? (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={(e) => setAddEther(e.target.value || "0")}
                  className={styles.input}
                />
                <input
                  type="number"
                  placeholder="Amount of PrytocDev tokens"
                  onChange={(e) =>
                    setAddPDTokens(
                      BigNumber.from(utils.parseEther(e.target.value || "0"))
                    )
                  }
                  className={styles.input}
                />
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={async (e) => {
                    setAddEther(e.target.value || "0");
                    const _addPDTokens = await calculatePD(
                      e.target.value || "0",
                      etherBalanceContract,
                      reservedPD
                    );
                    setAddPDTokens(_addPDTokens);
                  }}
                  className={styles.input}
                />
                <div className={styles.inputDiv}>
                  {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                  {`You will need ${utils.formatEther(addPDTokens)} Prytoc Dev
                  Tokens`}
                </div>
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            )}
            <div>
              <input
                type="number"
                placeholder="Amount of LP Tokens"
                onChange={async (e) => {
                  setRemoveLPTokens(e.target.value || "0");
                  await _getTokensAfterRemove(e.target.value || "0");
                }}
                className={styles.input}
              />
              <div className={styles.inputDiv}>
                {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                {`You will get ${utils.formatEther(removePD)} Prytoc
              Dev Tokens and ${utils.formatEther(removeEther)} Eth`}
              </div>
              <button className={styles.button1} onClick={_removeLiquidity}>
                Remove
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <input
            type="number"
            placeholder="Amount"
            onChange={async (e) => {
              setSwapAmount(e.target.value || "");
              // Calculate the amount of tokens user would receive after the swap
              await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
            }}
            className={styles.input}
            value={swapAmount}
          />
          <select
            className={styles.select}
            name="dropdown"
            id="dropdown"
            onChange={async () => {
              setEthSelected(!ethSelected);
              // Initialize the values back to zero
              await _getAmountOfTokensReceivedFromSwap(0);
              setSwapAmount("");
            }}
          >
            <option value="eth">Ethereum</option>
            <option value="cryptoDevToken">Prytoc Dev Token</option>
          </select>
          <br />
          <div className={styles.inputDiv}>
            {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
            {ethSelected
              ? `You will get ${utils.formatEther(
                  tokenToBeReceivedAfterSwap
                )} Prytoc Dev Tokens`
              : `You will get ${utils.formatEther(
                  tokenToBeReceivedAfterSwap
                )} Eth`}
          </div>
          <button className={styles.button1} onClick={_swapTokens}>
            Swap
          </button>
        </div>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Prytoc Devs</title>
        <meta name="description" content="DEX" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Prytoc Devs Exchange!</h1>
          <div className={styles.description}>
            Exchange Ethereum &#60;&#62; Prytoc Dev Tokens
          </div>
          <div>
            <button
              className={styles.button}
              onClick={() => {
                setLiquidityTab(true);
              }}
            >
              Liquidity
            </button>
            <button
              className={styles.button}
              onClick={() => {
                setLiquidityTab(false);
              }}
            >
              Swap
            </button>
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./prytocdev.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Blank Godd
      </footer>
    </div>
  );
}