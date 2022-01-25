import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import { CandyMachineAccount } from './candy-machine';

import { CircularProgress } from '@material-ui/core';
import { GatewayStatus, useGateway } from '@civic/solana-gateway-react';
import { useEffect, useState } from 'react';
import { mintPanic } from './userSettings';
import { toDate }  from './utils'


export const CTAButton = styled(Button)`
  
  width: 100%;
  height: 60px;
  margin-top: 10px;
  margin-bottom: 5px;
  background: linear-gradient(180deg, #604ae5 0%, #813eee 100%);
  color: white;
  font-size: 16px;
  font-weight: bold;
`; // add your styles here

export const MintButton = ({
  onMint,
  candyMachine,
  
  isMinting,
  
  
}: {
  onMint: () => Promise<void>;
  candyMachine: CandyMachineAccount | undefined;
  
  isMinting: boolean;
 
}) => {
  const { requestGatewayToken, gatewayStatus } = useGateway();
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    if (gatewayStatus === GatewayStatus.ACTIVE && clicked) {
      console.log('Minting');
      onMint();
      setClicked(false);
    }
  }, [gatewayStatus, clicked, setClicked, onMint]);
  return (
    <CTAButton
      className='minting-button'
      disabled={
        candyMachine?.state.isSoldOut ||
        isMinting ||
        mintPanic.enabled
      }
      onClick={async () => {
        setClicked(true);
        if (candyMachine?.state.isActive && candyMachine?.state.gatekeeper) {
          console.log('gatekeeper active')
          if (gatewayStatus === GatewayStatus.ACTIVE) {
            console.log(gatewayStatus + GatewayStatus.ACTIVE)
            setClicked(true);
          } else {
            console.log('requeting token')
             let token = await requestGatewayToken();
            console.log(token);
          }
        } else {
          await onMint();
          setClicked(false);
        }
      }}
      variant="contained"
    >
      <div className='mint-button-text'>
      {candyMachine?.state.isSoldOut ? (
        'SOLD OUT'
      ) : isMinting ? (
        <CircularProgress />
      
      ) : mintPanic.enabled ? (

        'Mint Paused'

      ) :  (
        'MINT'
      )}
      </div>
    </CTAButton>
  );
};