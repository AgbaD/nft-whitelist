import { Contract, providers } from "ethers";
import { formatEther } from "ethers/lib/utils";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {
  PRYTOCDEVS_DAO_ABI,
  PRYTOCDEVS_DAO_CONTRACT_ADDRESS,
  PRYTOCDEVS_NFT_ABI,
  PRYTOCDEVS_NFT_CONTRACT_ADDRESS,
} from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  // DAO ETH Balance
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  // Number of proposals created in the DAO
  const [numProposals, setNumProposals] = useState("0");
  // Array of all proposals created in the DAO
  const [proposals, setProposals] = useState([]);
  // User's balance of CryptoDevs NFTs
  const [nftBalance, setNftBalance] = useState(0);
  // Fake NFT Token ID to purchase. Used when creating a proposal.
  const [fakeNftTokenId, setFakeNftTokenId] = useState("");
  // One of "Create Proposal" or "View Proposals"
  const [selectedTab, setSelectedTab] = useState("");
  // True if waiting for a transaction to be mined, false otherwise.
  const [loading, setLoading] = useState(false);
  // True if user has connected their wallet, false otherwise
  const [walletConnected, setWalletConnected] = useState(false);
  // isOwner gets the owner of the contract through the signed address
  const [isOwner, setIsOwner] = useState(false);
  const web3ModalRef = useRef();

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  }

  const getDAOOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const prytocDevDAOContract = getDaoContractInstance(provider);
      const _owner = await prytocDevDAOContract.owner();
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      if (address.toLowerCase() == _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error(error.message);
    }
  }

  const withdrawDAOEther = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const prytocDevDAOContract = getDaoContractInstance(signer);
      const tx = await prytocDevDAOContract.withdrawEther();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      getDAOTreasuryBalance();
    } catch (error) {
      console.error(error);
      window.alert(error.reason);
    }
  }

  const getDAOTreasuryBalance = async () => {
    try {
      const provider = await getProviderOrSigner();
      const balance = await provider.getBalance(
        PRYTOCDEVS_DAO_CONTRACT_ADDRESS
      );
      setTreasuryBalance(balance.toString());
    } catch (error) {
      console.error(error);
    }
  }

  const getNumProposalsInDAO = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const prytocDevDAOContract = getDaoContractInstance(signer);
      const _numProposals = await prytocDevDAOContract.numProposals();
      setNumProposals(_numProposals.toString());
    } catch (error) {
      console.error(error);
    }
  }

  const getUserNFTBalance = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = getPrytocdevsNFTContractInstance(provider);
      const signer = await getProviderOrSigner(true);
      const balance = await nftContract.balanceOf(signer.getAddress());
      setNftBalance(parseInt(balance.toString()));
    } catch (error) {
      console.error(error)
    }
  }

  const createProposal = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const prytocDevDAOContract = getDaoContractInstance(signer);
      const tx = await prytocDevDAOContract.createProposal(fakeNftTokenId);
      setLoading(true);
      await tx.wait();
      await getNumProposalsInDAO();
      setLoading(false) 
    } catch (error) {
      console.error(error);
      window.alert(error.data.message);
    }
  }

  const fetchProposalById = async (id) => {
    try {
      const provider = await getProviderOrSigner();
      const prytocDevDAOContract = getDaoContractInstance(provider);
      const proposal = await prytocDevDAOContract.proposals(id);
      const parsedProposal = {
        proposalId: id,
        nftTokenId: proposal.nftTokenId.toString(),
        deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
        yayVotes: proposal.yayVotes.toString(),
        nayVotes: proposal.nayVotes.toString(),
        executed: proposal.executed,
      }
      return parsedProposal;
    } catch (error) {
      console.error(error);
    }
  }

  const fetchAllProposals = async () => {
    try {
      const proposals = []
      const provider = await getProviderOrSigner();
      for (let i=0; i < numProposals; i++) {
        const proposal = await fetchProposalById(i);
        proposals.push(proposal)
      }
      setProposals(proposals);
      return proposals;
    } catch (error) {
      console.error(error)
    }
  }

  const voteOnProposal = async (proposalId, _vote) => {
    try {
      const signer = await getProviderOrSigner(true);
      const prytocDevDAOContract = getDaoContractInstance(signer);
      let vote = _vote === 'YAY' ? 0 : 1;
      console.log(proposalId, vote)
      const tx = await prytocDevDAOContract.voteOnProposal(proposalId, vote);
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await fetchAllProposals()
    } catch (error) {
      console.error(error);
      window.alert(error.message.reason)
    }
  }

  const executeProposal = async (proposalId) => {
    try {
      const signer = await getProviderOrSigner(true);
      const prytocDevDAOContract = getDaoContractInstance(signer);
      const tx = await prytocDevDAOContract.executeProposal(proposalId);
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await fetchAllProposals();
      await getDAOTreasuryBalance();
    } catch (error) {
      console.error(error);
      window.alert(error.message)
    }
  }

  const getDaoContractInstance = (providerOrSigner) => {
    return new Contract(
      PRYTOCDEVS_DAO_CONTRACT_ADDRESS,
      PRYTOCDEVS_DAO_ABI,
      providerOrSigner
    )
  }

  const getPrytocdevsNFTContractInstance = (providerOrSigner) => {
    return new Contract(
      PRYTOCDEVS_NFT_CONTRACT_ADDRESS,
      PRYTOCDEVS_NFT_ABI,
      providerOrSigner
    );
  };

  const getProviderOrSigner = async (needSigner=false) => {
    try {
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider)

      const {chainId} = await web3Provider.getNetwork();
      if(chainId !== 80001) {
        window.alert("Please switch to the Polygon mumbai network!");
        throw new Error("Please switch to the Polygon mumbai network");
      }
      if(needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }
      return web3Provider;
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "mumbai",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet().then(() => {
        getDAOTreasuryBalance();
        getUserNFTBalance();
        getNumProposalsInDAO();
        getDAOOwner();
      });
    }
  }, [walletConnected]);

  useEffect(() => {
    if (selectedTab === "View Proposals") {
      fetchAllProposals();
    }
  }, [selectedTab]);

  function renderTabs() {
    if (selectedTab === "Create Proposal") {
      return renderCreateProposalTab();
    } else if (selectedTab === "View Proposals") {
      return renderViewProposalsTab();
    }
    return null;
  }

  // Renders the 'Create Proposal' tab content
  function renderCreateProposalTab() {
    if (loading) {
      return (
        <div className={styles.description}>
          Loading... Waiting for transaction...
        </div>
      );
    } else if (nftBalance === 0) {
      return (
        <div className={styles.description}>
          You do not own any PrytocDevs NFTs. <br />
          <b>You cannot create or vote on proposals</b>
        </div>
      );
    } else {
      return (
        <div className={styles.container}>
          <label>Fake NFT Token ID to Purchase: </label>
          <input
            placeholder="0"
            type="number"
            onChange={(e) => setFakeNftTokenId(e.target.value)}
          />
          <button className={styles.button2} onClick={createProposal}>
            Create
          </button>
        </div>
      );
    }
  }

  // Renders the 'View Proposals' tab content
  function renderViewProposalsTab() {
    if (loading) {
      return (
        <div className={styles.description}>
          Loading... Waiting for transaction...
        </div>
      );
    } else if (proposals.length === 0) {
      return (
        <div className={styles.description}>No proposals have been created</div>
      );
    } else {
      return (
        <div>
          {proposals.map((p, index) => (
            <div key={index} className={styles.proposalCard}>
              <p>Proposal ID: {p.proposalId}</p>
              <p>Fake NFT to Purchase: {p.nftTokenId}</p>
              <p>Deadline: {p.deadline.toLocaleString()}</p>
              <p>Yay Votes: {p.yayVotes}</p>
              <p>Nay Votes: {p.nayVotes}</p>
              <p>Executed?: {p.executed.toString()}</p>
              {p.deadline.getTime() > Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => voteOnProposal(p.proposalId, "YAY")}
                  >
                    Vote YAY
                  </button>
                  <button
                    className={styles.button2}
                    onClick={() => voteOnProposal(p.proposalId, "NAY")}
                  >
                    Vote NAY
                  </button>
                </div>
              ) : p.deadline.getTime() < Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => executeProposal(p.proposalId)}
                  >
                    Execute Proposal{" "}
                    {p.yayVotes > p.nayVotes ? "(YAY)" : "(NAY)"}
                  </button>
                </div>
              ) : (
                <div className={styles.description}>Proposal Executed</div>
              )}
            </div>
          ))}
        </div>
      );
    }
  }

  return (
    <div>
      <Head>
        <title>PrytocDevs DAO</title>
        <meta name="description" content="CryptoDevs DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Prytoc Devs!</h1>
          <div className={styles.description}>Welcome to the DAO!</div>
          <div className={styles.description}>
            Your PrytocDevs NFT Balance: {nftBalance}
            <br />
            Treasury Balance: {formatEther(treasuryBalance)} ETH
            <br />
            Total Number of Proposals: {numProposals}
          </div>
          <div className={styles.flex}>
            <button
              className={styles.button}
              onClick={() => setSelectedTab("Create Proposal")}
            >
              Create Proposal
            </button>
            <button
              className={styles.button}
              onClick={() => setSelectedTab("View Proposals")}
            >
              View Proposals
            </button>
          </div>
          {renderTabs()}
          {/* Display additional withdraw button if connected wallet is owner */}
          {isOwner ? (
            <div>
            {loading ? <button className={styles.button}>Loading...</button>
                     : <button className={styles.button} onClick={withdrawDAOEther}>
                         Withdraw DAO ETH
                       </button>
            }
            </div>
            ) : ("")
          }
        </div>
        <div>
          <img className={styles.image} src="/prytocdevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Blank Godd
      </footer>
    </div>
  );
}

