import React, { Component } from 'react';
import Web3 from "web3";
import './App.css';
import ABI from "./ABI.json";
import RenJS from "@renproject/ren";

// Finish typings for window
declare global {
  interface Window {
    ethereum?: {
      enable: () => Promise<true>;
    };
    web3?: any
  }
}

// Replace with your contract's address.
const contractAddress = "0x79D41Af9B3e535925a47F85130146065AFC25352";

interface AppProps {

}

interface AppState {
  balance: number;
  balanceBCH: number;
  message: string;
  error: string;
  renJS: RenJS;
  web3?: Web3
}

class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      renJS: new RenJS("testnet"),
      balance: 0,
      balanceBCH: 0,
      message: "",
      error: "",
    }
  }

  componentDidMount = async () => {
    let web3Provider;

    // Initialize web3 (https://medium.com/coinmonks/web3-js-ethereum-javascript-api-72f7b22e2f0a)
    // Modern dApp browsers...
    if (window.ethereum) {
      web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        this.logError("Please allow access to your Web3 wallet.");
        return;
      }
    }
    // Legacy dApp browsers...
    else if (window.web3) {
      web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      this.logError("Please install MetaMask!");
      return;
    }

    const web3 = new Web3(web3Provider);

    const networkID = await web3.eth.net.getId();
    if (networkID !== 42) {
      this.logError("Please set your network to Kovan.");
      return;
    }

    this.setState({ web3 }, () => {

      // Update balances immediately and every 10 seconds
      this.updateBalance();
      setInterval(() => {
        this.updateBalance();
      }, 10 * 1000);
    });
  }

  render = () => {
    const { balance, balanceBCH, message, error } = this.state;
    return (
      <div className="App">
        <p>Balance: {balance} BTC</p>
        <p>Balance: {balanceBCH} BCH</p>
        <p><button onClick={() => this.deposit().catch(this.logError)}>Deposit 0.001 BTC</button></p>
        <p><button onClick={() => this.withdraw().catch(this.logError)}>Withdraw {balance} BTC</button></p>
        <p><button onClick={() => this.depositBCH().catch(this.logError)}>Deposit 0.001 BCH</button></p>
        <p><button onClick={() => this.withdrawBCH().catch(this.logError)}>Withdraw {balanceBCH} BCH</button></p>
        <p>{message}</p>
        {error ? <p style={{ color: "red" }}>{error}</p> : null}
      </div>
    );
  }

  updateBalance = async () => {
    const { web3 } = this.state;
    if (!web3) return;
    const contract = new web3.eth.Contract(ABI as any, contractAddress);
    const balance = await contract.methods.balance('BTC').call();
    const BTC = parseInt(balance.toString()) / 10 ** 8;
    const balanceBCH = await contract.methods.balance('BCH').call();
    const BCH = parseInt(balanceBCH.toString()) / 10 ** 8;
    this.setState({ balance: BTC, balanceBCH: BCH });
  }

  logError = (error: string | Error) => {
    console.error(error);
    if (typeof error === 'string') {
      this.setState({ error });
    } else {
      this.setState({ error: String((error || {}).message || error) });
    }
  }

  log = (message: string) => {
    this.setState({ message });
  }

  deposit = async () => {
    const { web3, renJS } = this.state;
    const amount = 0.001; // BTC

    if (!web3) return;

    const mint = renJS.lockAndMint({
      // Send BTC from the Bitcoin blockchain to the Ethereum blockchain.
      sendToken: RenJS.Tokens.BTC.Btc2Eth,

      // The contract we want to interact with
      sendTo: contractAddress,

      // The name of the function we want to call
      contractFn: "depositBTC",

      nonce: renJS.utils.randomNonce(),

      // Arguments expected for calling `deposit`
      contractParams: [
        {
          name: "_msg",
          type: "bytes",
          value: web3.utils.fromAscii(`Depositing ${amount} BTC`),
        }
      ],

      // Web3 provider for submitting mint to Ethereum
      web3Provider: web3.currentProvider,
    });

    // Show the gateway address to the user so that they can transfer their BTC to it.
    const gatewayAddress = await mint.gatewayAddress();
    this.log(`Deposit ${amount} BTC to ${gatewayAddress}`);

    // Wait for the Darknodes to detect the BTC transfer.
    const confirmations = 0;
    const deposit = await mint.wait(confirmations);

    // Retrieve signature from RenVM.
    this.log("Submitting to RenVM...");
    const signature = await deposit.submit();

    // Submit the signature to Ethereum and receive zBTC.
    this.log("Submitting to smart contract...");
    await signature.submitToEthereum(web3.currentProvider as any);
    this.log(`Deposited ${amount} BTC.`);
  }

  depositBCH = async () => {
    const { web3, renJS } = this.state;
    const amount = 0.001; // BCH

    if (!web3) return;

    const mint = renJS.lockAndMint({
      // Send BTC from the Bitcoin blockchain to the Ethereum blockchain.
      sendToken: RenJS.Tokens.BCH.Bch2Eth,

      // The contract we want to interact with
      sendTo: contractAddress,

      // The name of the function we want to call
      contractFn: "depositBCH",

      nonce: renJS.utils.randomNonce(),

      // Arguments expected for calling `deposit`
      contractParams: [
        {
          name: "_msg",
          type: "bytes",
          value: web3.utils.fromAscii(`Depositing ${amount} BCH`),
        }
      ],

      // Web3 provider for submitting mint to Ethereum
      web3Provider: web3.currentProvider,
    });

    // Show the gateway address to the user so that they can transfer their BTC to it.
    const gatewayAddress = await mint.gatewayAddress();
    this.log(`Deposit ${amount} BCH to ${gatewayAddress}`);

    // Wait for the Darknodes to detect the BTC transfer.
    const confirmations = 0;
    const deposit = await mint.wait(confirmations);

    // Retrieve signature from RenVM.
    this.log("Submitting to RenVM...");
    const signature = await deposit.submit();

    // Submit the signature to Ethereum and receive zBTC.
    this.log("Submitting to smart contract...");
    await signature.submitToEthereum(web3.currentProvider as any);
    this.log(`Deposited ${amount} BCH.`);
  }

  withdraw = async () => {
    const { web3, renJS, balance } = this.state;
    if (!web3) return;

    const amount = balance;
    const recipient = prompt("Enter BTC recipient:");
    if (!recipient) return;
    const from = (await web3.eth.getAccounts())[0];
    const contract = new web3.eth.Contract(ABI as any, contractAddress);

    this.log("Calling `withdrawBTC` on smart contract...");
    const ethereumTxHash: string = await new Promise((resolve, reject) => {
      contract.methods.withdrawBTC(
        web3.utils.fromAscii(`Withdrawing ${amount} BTC`), // _msg
        RenJS.utils.btc.addressToHex(recipient), //_to
        Math.floor(amount * (10 ** 8)), // _amount in Satoshis
      ).send({ from })
        .on("transactionHash", resolve)
        .catch(reject);
    });

    this.log(`Retrieving burn event from contract...`);
    const burn = await renJS.burnAndRelease({
      // Send BTC from the Ethereum blockchain to the Bitcoin blockchain.
      // This is the reverse of shitIn.
      sendToken: RenJS.Tokens.BTC.Eth2Btc,

      // The web3 provider to talk to Ethereum
      web3Provider: web3.currentProvider,

      // The transaction hash of our contract call
      ethereumTxHash,
    }).readFromEthereum();

    this.log(`Submitting to Darknodes...`);
    await burn.submit();
    this.log(`Withdrew ${amount} BTC to ${recipient}.`);
  }

  withdrawBCH = async () => {
    const { web3, renJS, balance } = this.state;
    if (!web3) return;

    const amount = balance;
    const recipient = prompt("Enter BCH recipient:");
    if (!recipient) return;
    const from = (await web3.eth.getAccounts())[0];
    const contract = new web3.eth.Contract(ABI as any, contractAddress);

    this.log("Calling `withdrawBCH` on smart contract...");
    const ethereumTxHash: string = await new Promise((resolve, reject) => {
      contract.methods.withdrawBTC(
        web3.utils.fromAscii(`Withdrawing ${amount} BCH`), // _msg
        RenJS.utils.btc.addressToHex(recipient), //_to
        Math.floor(amount * (10 ** 8)), // _amount in Satoshis
      ).send({ from })
        .on("transactionHash", resolve)
        .catch(reject);
    });

    this.log(`Retrieving burn event from contract...`);
    const burn = await renJS.burnAndRelease({
      // Send BTC from the Ethereum blockchain to the Bitcoin blockchain.
      // This is the reverse of shitIn.
      sendToken: RenJS.Tokens.BCH.Eth2Bch,

      // The web3 provider to talk to Ethereum
      web3Provider: web3.currentProvider,

      // The transaction hash of our contract call
      ethereumTxHash,
    }).readFromEthereum();

    this.log(`Submitting to Darknodes...`);
    await burn.submit();
    this.log(`Withdrew ${amount} BCH to ${recipient}.`);
  }
}

export default App;
