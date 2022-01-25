import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Container, Snackbar } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Alert from "@material-ui/lab/Alert";

import * as anchor from "@project-serum/anchor";

import { PublicKey } from "@solana/web3.js";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";

import {
  awaitTransactionSignatureConfirmation,
  CandyMachineAccount,
  CANDY_MACHINE_PROGRAM,
  getCandyMachineState,
  mintOneToken,
} from "./candy-machine";

import { AlertState } from "./utils";
import { MintButton } from "./MintButton";
import { getPhase, Header, Phase, PhaseHeader } from "./PhaseHeader";
import { GatewayProvider } from "@civic/solana-gateway-react";
import {
  welcomeSettings
} from "./userSettings";
import { number } from "prop-types";

const ConnectButton = styled(WalletDialogButton)`
  width: 100%;
  height: 60px;
  margin-top: 40px;
  background: linear-gradient(180deg, #604ae5 0%, #813eee 100%);
  color: white;
  font-size: 16px;
  font-weight: bold;
  transform: translate(0%, -50%);
`;

const MintContainer = styled.div`
  width: 100%;
  left: 0px;
  bottom: 15px;
`; // add your styles here

export interface HomeProps {
  candyMachineId?: anchor.web3.PublicKey;

  connection: anchor.web3.Connection;
  startDate: number;
  txTimeout: number;
  rpcHost: string;
}

const Home = (props: HomeProps) => {
  // const [yourSOLBalance, setYourSOLBalance] = useState<number | null>(null);
  const rpcUrl = props.rpcHost;
  const [whiteListTokenBalance, setWhiteListTokenBalance] = useState<number>(0);
  const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT
  const [mintingTotal, setMintingTotal] = useState<number | null>(null);
  const [itemsAvailable, setItemsAvailable] = useState<number | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey>();
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  const [candyMachine, setCandyMachine] = useState<CandyMachineAccount>();

  const [price, setPrice] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const wallet = useWallet();

  const anchorWallet = useMemo(() => {
    if (
      !wallet ||
      !wallet.publicKey ||
      !wallet.signAllTransactions ||
      !wallet.signTransaction
    ) {
      return;
    }

    return {
      publicKey: wallet.publicKey,
      signAllTransactions: wallet.signAllTransactions,
      signTransaction: wallet.signTransaction,
    } as anchor.Wallet;
  }, [wallet]);

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const onMint = async () => {
    try {
      setIsMinting(true);
      document.getElementById("#identity")?.click();
      if (wallet.connected && candyMachine?.program && wallet.publicKey) {
        const mintTxId = (
          await mintOneToken(candyMachine, wallet.publicKey)
        )[0];

        let status: any = { err: true };
        if (mintTxId) {
          status = await awaitTransactionSignatureConfirmation(
            mintTxId,
            props.txTimeout,
            props.connection,
            "singleGossip",
            true
          );
        }

        if (!status?.err) {
          setAlertState({
            open: true,
            message: "Congratulations! Mint succeeded! Please wait a few seconds for the wallet to update.",
            severity: "success",
          });

          setMintingTotal(mintingTotal! + 1);

          if (whiteListTokenBalance && whiteListTokenBalance > 0)
            setWhiteListTokenBalance(whiteListTokenBalance - 1);
        } else {
          setAlertState({
            open: true,
            message: "Mint failed! Please try again!",
            severity: "error",
          });
        }
      }
    } catch (error: any) {
      // TODO: blech:
      let message = error.msg || "Minting failed! Please try again!";
      if (!error.msg) {
        if (!error.message) {
          message = "Transaction Timeout! Please try again.";
        } else if (error.message.indexOf("0x138")) {
        } else if (error.message.indexOf("0x137")) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          window.location.reload();
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      setIsMinting(true);
      setIsBalanceLoading(true);
    }
  };

  useEffect(() => {
    (async () => {
      if (!anchorWallet) {
        console.log("anchor wallet not found");
        return;
      }
      console.log("wallet connected");
      if(anchorWallet?.publicKey){
      setPublicKey(anchorWallet.publicKey)
      }

      // try {
      //   const balance = await props.connection.getBalance(
      //     anchorWallet.publicKey
      //   );
      //   console.log("Sol balance is: " + balance);
      //   setYourSOLBalance(balance);
      // } catch (e) {
      //   console.log("Problem getting fair launch state");
      //   console.log(e);
      // }

      if (props.candyMachineId) {
        try {
          const cndy = await getCandyMachineState(
            anchorWallet,
            props.candyMachineId,
            props.connection
          );
          await setCandyMachine(cndy);
        } catch (e) {
          console.log("Problem getting candy machine state");
          console.log(e);
        }
      } else {
        console.log("No candy machine detected in configuration.");
      }
    })();
  }, [anchorWallet, props.candyMachineId, props.connection]);

  useEffect(() => {
    async function getTokenAmount() {
      if (
        publicKey &&
        candyMachine?.state.whitelistMintSettings?.mint
      ) {
        try {
          var tokenAmount =
            await props.connection.getParsedTokenAccountsByOwner(
              publicKey,
              { mint: candyMachine?.state.whitelistMintSettings?.mint }
            );
          setWhiteListTokenBalance(
            tokenAmount.value[0].account.data.parsed.info.tokenAmount.amount
          );
        } catch {
          setWhiteListTokenBalance(0);
        }
      }
    }

    getTokenAmount();

    if (candyMachine?.state.itemsAvailable) {
      setItemsAvailable(candyMachine?.state.itemsAvailable);
    }

    if (candyMachine?.state.itemsRedeemed == null) {
      setMintingTotal(0);
    } else {
      setMintingTotal(candyMachine?.state.itemsRedeemed);
    }

    if (candyMachine?.state.price) {
      setPrice(candyMachine?.state.price.toNumber() / 1000000000);
    }

    getBalance();

    if (wallet && wallet.publicKey) {
      props.connection.onAccountChange(wallet.publicKey, () => {
        getBalance();
        setIsBalanceLoading(false);
        setIsMinting(false);
      })
    }

  }, [candyMachine, publicKey, props.connection]);

  const phase = getPhase(candyMachine);

  const shortenAddress = (address: string, chars = 4): string => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  };

  const getBalanceInSolana = (balance: number): number => {
    var balance = Math.round(((balance / 1000000000) + Number.EPSILON) * 100000) / 100000;
    return balance;
  };
  
  const getBalance = async () => {
    var balance = wallet && wallet.publicKey ? await props.connection.getBalance(wallet?.publicKey) : '';
    setBalance(+balance);
  }

  return (
    <Container>
      <Container maxWidth="xs" style={{ position: "relative" }}>
        <Paper
          style={{
            display: "flex",
            borderRadius: 6,
          }}
          className="minting-box"
        >
          <Grid container justifyContent="space-between" direction="column">
            {phase === Phase.Welcome ? <Header
              desc=""
              phaseName="Please wait for Mint to go live!"
              date={welcomeSettings.countdownTo}
              countdownEnable={welcomeSettings.countdownEnable}
            /> : (
              <div>
              {!wallet || !wallet.publicKey && <Header
                desc=""
                phaseName="Please connect a wallet"
                date={welcomeSettings.countdownTo}
                countdownEnable={false}
              />}
            </div>)}
            <br/>

            <div>
              {(phase === Phase.PublicMint) && (
                <>
                  {!wallet.connected ? (
                    <ConnectButton>Connect Wallet</ConnectButton>
                  ) : (
                    <MintContainer>
                      {candyMachine?.state.isActive &&
                      candyMachine?.state.gatekeeper &&
                      wallet.publicKey &&
                      wallet.signTransaction ? (
                        <GatewayProvider
                          wallet={{
                            publicKey:
                              wallet.publicKey ||
                              new PublicKey(CANDY_MACHINE_PROGRAM),
                            //@ts-ignore
                            signTransaction: wallet.signTransaction,
                          }}
                          // // Replace with following when added
                          // gatekeeperNetwork={candyMachine.state.gatekeeper_network}
                          gatekeeperNetwork={
                            candyMachine?.state?.gatekeeper?.gatekeeperNetwork
                          } // This is the ignite (captcha) network
                          /// Don't need this for mainnet
                          clusterUrl={rpcUrl}
                          options={{ autoShowModal: false }}
                        >
                          <MintButton
                            candyMachine={candyMachine}
                            isMinting={isMinting}
                            onMint={onMint}
                          />
                        </GatewayProvider>
                      ) : (
                        <MintButton
                          candyMachine={candyMachine}
                          isMinting={isMinting}
                          onMint={onMint}
                        />
                      )}
                    </MintContainer>
                  )}
                  <br/>
                  <p style={{color: 'white'}}>{wallet && wallet.publicKey ? 'Wallet Connected : ' : ''} {shortenAddress(wallet.publicKey?.toString() || '')}</p>
                  {wallet && wallet.publicKey && balance && isBalanceLoading ? <p style={{color: 'white'}}>Wallet Balance : Loading...</p> : ''}
                  {wallet && wallet.publicKey && balance != undefined && !isBalanceLoading ? <p style={{color: 'white'}}>Wallet Balance : {getBalanceInSolana(balance)}</p> : ''}
                  <br/>
                </>
              )}
              <Grid
                    color="textSecondary"
                  >
                    <div className="test-stat">
                      {(phase === Phase.PublicMint) &&
                        (itemsAvailable !== null && mintingTotal !== null ? (
                          <p> Minted / Total : {mintingTotal + " / " + itemsAvailable}</p>
                        ) : (
                          <p className="loading"></p>
                        ))}
                    </div>

                    <div className="">
                      {phase === Phase.PublicMint ? (
                        <>
                          {price ? (
                            <p>Price : {price} Sol</p>
                          ) : (
                            <p className="loading"></p>
                          )}
                        </>
                      ) : (
                        ""
                      )}

                      {/* {formatSol(yourSOLBalance || 0).toLocaleString()} SOL */}
                    </div>
                  </Grid>
            </div>
          </Grid>
        </Paper>
      </Container>

      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Home;
