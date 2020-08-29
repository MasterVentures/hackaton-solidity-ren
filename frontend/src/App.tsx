import React, { Component } from 'react';
import Web3 from "web3";
import './App.css';
import ABI from "./ABI.json";

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
const contractAddress = "0xfAf9454B5084Ec633d6d4F5a09b21dFa3a3d3bD4";

interface AppProps {

}

interface AppState {
  balance: number;
  message: string;
  error: string;
  web3?: Web3
}

class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      balance: 0,
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
    const { balance, message, error } = this.state;
    return (
      <div className="App">
        <p>Balance: {balance} BTC</p>
        <p><button onClick={() => this.deposit().catch(this.logError)}>Deposit 0.001 BTC</button></p>
        <p><button onClick={() => this.withdraw().catch(this.logError)}>Withdraw {balance} BTC</button></p>
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
    this.setState({ balance: parseInt(balance.toString()) / 10 ** 8 });
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
    this.logError("");
    // TODO
  }

  withdraw = async () => {
    this.logError("");
    // TODO
  }
}

export default App;
