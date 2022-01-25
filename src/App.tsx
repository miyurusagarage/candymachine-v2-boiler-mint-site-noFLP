import "./App.css";
import { useMemo } from "react";

import Minter from "./Minter";

import * as anchor from "@project-serum/anchor";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
  getMathWallet,
  getLedgerWallet,
  getSlopeWallet,
  getSolletExtensionWallet
} from "@solana/wallet-adapter-wallets";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";

import { WalletDialogProvider } from "@solana/wallet-adapter-material-ui";
import { ThemeProvider, createTheme } from "@material-ui/core";
import { BrowserRouter as Router } from "react-router-dom";
import "@solana/wallet-adapter-react-ui/styles.css";
import { WalletDisconnectButton } from "@solana/wallet-adapter-material-ui";

const theme = createTheme({
  palette: {
    type: "dark",
  },
});

const candyMachineId = process.env.REACT_APP_CANDY_MACHINE_ID
  ? new anchor.web3.PublicKey(process.env.REACT_APP_CANDY_MACHINE_ID)
  : undefined;

const network = process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork;

const rpcHost = process.env.REACT_APP_SOLANA_RPC_HOST!;
const connection = new anchor.web3.Connection(rpcHost);

const startDateSeed = parseInt(process.env.REACT_APP_CANDY_START_DATE!, 10);

const txTimeout = 30000; // milliseconds (confirm this works for your project)

const App = () => {
  const endpoint = useMemo(() => clusterApiUrl(network), []);

  const wallets = useMemo(
    () => [getPhantomWallet(), getSolflareWallet(), getSolletWallet({ network }), getMathWallet(), getLedgerWallet(), getSlopeWallet(), getSolletExtensionWallet({network}) ],
    []
  );

  const onWalletError = (e: any) => {
    console.log(e);
  }

  return (
      <ThemeProvider theme={theme}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect onError={onWalletError}>
            <WalletDialogProvider>
              <div>
                <nav>
                  <div className="nav-container">
                    <a href="https://wcsc.io" target="_blank">
                      <img className="nav-logo" src="/img/wcsc-logo.png" alt="" />
                    </a>
                    <div className="social-icons">
                      <a href="https://twitter.com/wcscnft" target="_blank" className="hide-800">
                        <img className="nav-social" src="/icons/twitter.svg" alt="" />
                      </a>
                      <a href="https://discord.gg/9SS25t5A" target="_blank" className="hide-800">
                        <img className="nav-social" src="/icons/discord.svg" alt="" />
                      </a>
                      <div style={{paddingBottom: 10, display: 'flex', alignItems: 'center'}}>
                        <WalletDisconnectButton />
                      </div>
                    </div>
                  </div>
                </nav>
                <div className="content-wrapper">
                    <header className="card" id="link1">
                      <div style={{ padding: "0 24px 0 24px 0", textAlign: 'center' }}>
                        <h1 className="pb-3" style={{color: 'white'}}>Mint your Working Cat!</h1>
                      </div>
                      <div style={{textAlign: 'center'}}>
                        
                        <Minter
                          candyMachineId={candyMachineId}
                          connection={connection}
                          startDate={startDateSeed}
                          txTimeout={txTimeout}
                          rpcHost={rpcHost}
                        />
                              
                      </div>
                    </header>
                </div>
              </div>
            </WalletDialogProvider>
          </WalletProvider>
        </ConnectionProvider>
      </ThemeProvider>
  );
};

export default App;
