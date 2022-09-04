import React from 'react';
import styled, {css} from 'styled-components';
import {useTimer} from '../../../../hooks';
import {useEMSWrite} from '../../../../ethUtils';
import {BigNumber} from 'ethers';
import {styling} from '../../../styling';

interface AcceptTimerProps {
  tokenId: BigNumber;
  acceptEnabledTime: Date;
}

export const AcceptTimer = (props: AcceptTimerProps) => {
  const {write: acceptClaim, isLoading} = useEMSWrite('acceptClaim', props.tokenId);
  const secondsLeft = useTimer(props.acceptEnabledTime);

  return (
    <SpacingContainer>
      <BorderContainer amountFilled={(60 - secondsLeft) / 60} onClick={() => acceptClaim()}>
        <InnerContainer>{secondsLeft || (isLoading ? 'Waiting' : 'Accept')}</InnerContainer>
      </BorderContainer>
    </SpacingContainer>
  );
};

const SpacingContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 9rem;
`;

const buttonRadius = '2rem';
const borderWidth = '4px';
const borderColor = styling.orange;

const BorderContainer = styled.div<{amountFilled: number}>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: calc(${buttonRadius} * 2);
  height: calc(${buttonRadius} * 2);
  border-radius: ${buttonRadius};
  background: conic-gradient(${borderColor} 0deg, ${borderColor} ${props => props.amountFilled}turn,
  ${styling.grey3} ${props => props.amountFilled}turn), ${borderColor};
  transition: all 0.2s;

  ${props => props.amountFilled === 1 ? css`
    width: 7rem;
    background: ${borderColor};
    cursor: pointer;

    ${InnerContainer} {
      background-color: #6e6e6e;
    }

    &:hover {
      color: ${styling.textHighlight};
      background-color: #f6992f;
    }
  ` : ''}
`;

const InnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: calc(100% - 2 * ${borderWidth});
  height: calc(100% - 2 * ${borderWidth});
  border-radius: calc(${buttonRadius} - ${borderWidth});
  background-color: #494949;
  font-size: 20px;
  overflow: hidden;
  transition: background-color 0.2s;
`;
