import { BigNumber, Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  const zero = BigNumber.from(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  // tokens to be claimed based on number of owned nfts
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  const [prytocDevTokenBalance, setPrytocDevTokenBalance] = useState(zero);
  const [tokenAmount, setTokenAmount] = useState(zero);
  // total tokens minted overall for PDT
  const [totalTokensMinted, setTotalTokensMinted] = useState(zero);
  const [isOwner, setIsOwner] = useState(false);
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();

  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      )
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const nftBalance = await nftContract.balanceOf(address)

      if (nftBalance === zero) {
        setTokensToBeClaimed(zero)
      } else {
        var amount = 0;
        for (var i = 0; i < nftBalance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }
        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch (error) {
      console.error(error)
      setTokensToBeClaimed(zero)
    }
  }

  const getPrytocDevTokenBalance = async () => {
    try {
      const provider = await getProviderOrSigner()
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      setPrytocDevTokenBalance(balance);
    } catch (error) {
      console.error(error);
      setPrytocDevTokenBalance(zero)
    }
  }

  const mintPrytocDevToken = async (amount) => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      )
      const value = 0.001 * amount;
      const tx = await tokenContract.mint(amount, {
        value: utils.parseEther(value.toString()),
      })
      setLoading(true)
      await tx.wait()
      setLoading(false)
      window.alert("You have minted Prytoc dev token!")
      await getPrytocDevTokenBalance();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (error) {
      console.error(error)
      window.alert("Could not mint tokens!")
    }
  }

  const claimPrytocDevToken = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      )
      const tx = await tokenContract.claim()
      setLoading(true)
      await tx.wait()
      setLoading(false)
      window.alert("You have minted Prytoc dev token!")
      await getPrytocDevTokenBalance();
      await getTotalTokensMinted();
    } catch (error) {
      console.error(error)
      window.alert("Could not mint tokens!")
    }
  }

  const getTotalTokensMinted = async () => {
    try {
      const provider = await getProviderOrSigner()
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )
      const _totalTokensMinted = await tokenContract.totalSupply();
      setTotalTokensMinted(_totalTokensMinted);
    } catch (error) {
      console.error(error)
    }
  }

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner()
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )
      const _owner = await tokenContract.owner();
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner(
        setWalletConnected(true)
      )
    } catch (error) {
      console.error(error)
    }
  }

  const withdrawCoins = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS, 
        TOKEN_CONTRACT_ABI,
        signer
      )
      const tx = await tokenContract.withdraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      getOwner();
    } catch (error) {
      console.error(error)
      window.alert(error.reason)
    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider)

    // Check if user is connected to a correct chain
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 80001) {
      window.alert("Change network to Polygon Mumbai");
      throw new Error("Change network to Polygon Mumbai");
    }

    if(needSigner) {
      const signer = web3Provider.getSigner()
      return signer
    }
    return web3Provider;
  }

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "mumbai",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getTotalTokensMinted();
      getPrytocDevTokenBalance();
      getTokensToBeClaimed();
      getOwner();
    }
  }, [walletConnected])

  const renderButton = () => {
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }

    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimPrytocDevToken}>
            Claim Tokens
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from converts the `e.target.value` to a BigNumber
            // onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            onChange={(e) => setTokenAmount(e.target.value)}
            className={styles.input}
          />
        </div>

        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintPrytocDevToken(tokenAmount)}
        >
          Mint Tokens
        </button>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Prytoc Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Prytoc Devs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Prytoc Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted {utils.formatEther(prytocDevTokenBalance)} Prytoc
                Dev Tokens
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(totalTokensMinted)}/10000 have been minted!!!
              </div>
              {renderButton()}
              {/* Display additional withdraw button if connected wallet is owner */}
                {isOwner ? (
                  <div>
                  {loading ? <button className={styles.button}>Loading...</button>
                           : <button className={styles.button} onClick={withdrawCoins}>
                               Withdraw Coins
                             </button>
                  }
                  </div>
                  ) : ("")
                }
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by BlankGodd
      </footer>
    </div>
  )
}