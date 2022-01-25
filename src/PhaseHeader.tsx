import * as anchor from "@project-serum/anchor";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { PhaseCountdown } from "./countdown";
import { toDate } from "./utils";
import { CandyMachineAccount } from "./candy-machine";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  welcomeSettings,
  mintPanic,
} from "./userSettings";
import { Container } from "@material-ui/core";

export enum Phase {
  AnticipationPhase, // FL, AKA Phase 0
  SetPrice, // FL, AKA Phase 1
  GracePeriod, // FL, AKA Phase 2
  Lottery, // FL
  RaffleFinished, // FL, AKA Phase 3
  WaitForCM, // FL,
  Phase4,
  MintOff,
  WhiteListMint,
  PublicMint,
  Welcome,
  Panic,
}

export function getPhase(
  candyMachine: CandyMachineAccount | undefined
): Phase {
  const curr = new Date().getTime();
  const publicSaleStart = toDate(welcomeSettings.countdownTo)?.getTime();
  if (mintPanic.enabled === true) {
    return Phase.Panic;
  } else if (publicSaleStart && curr > publicSaleStart) {
    return Phase.PublicMint;
  } else {
    return Phase.Welcome;
  }
}

export const Header = (props: {
  phaseName: string;
  desc: string | undefined;
  date?: anchor.BN | undefined;
  status?: string;
  countdown?: boolean;
  countdownEnable?: boolean;
}) => {
  const { phaseName, desc, date, status, countdownEnable } = props;
  return (
    <>
      {countdownEnable === true && (
        <Grid
          container
          style={{ position: "absolute", top: "-30px", left: "0px" }}
        >
          <Container style={{ justifyContent: "center" }}>
            <PhaseCountdown
              date={toDate(date)}
              style={{ justifyContent: "center" }}
              status={status || "COMPLETE"}
            />
          </Container>
        </Grid>
      )}
      <Grid container className="mintHeader" alignItems="center">
        <Grid>
          <Typography
            variant="h6"
            style={{ fontWeight: 600, textAlign: "center" }}
            className="pb-2"
          >
            {phaseName}
          </Typography>
        </Grid>
      </Grid>
    </>
  );
};

type PhaseHeaderProps = {
  phase: Phase;

  candyMachine?: CandyMachineAccount;
 
  rpcUrl: string;
};

export const PhaseHeader = ({
  phase,
  
  candyMachine,
 
  
}: PhaseHeaderProps) => {
  const wallet = useWallet();

  return (
    <>
      {phase === Phase.Panic && (
        <Header phaseName={mintPanic.title} desc={mintPanic.desc} />
      )}

      {phase === Phase.Welcome && (
        <Header
          phaseName={welcomeSettings.title}
          desc={welcomeSettings.desc}
          date={welcomeSettings.countdownTo}
          countdownEnable={welcomeSettings.countdownEnable}
        />
      )}
    </>
  );
};