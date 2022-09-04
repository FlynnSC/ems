import React, {useMemo} from 'react';
import styled from 'styled-components';
import {observer} from 'mobx-react-lite';
import {globalState, NewClaimEntry, NewClaimEntryStatus} from '../../../../state/globalState';
import {DurationDisplay} from '../../../common/DurationDisplay';
import {Button, LabelText} from '../../../common/StyledComponents';
import {AcceptTimer} from './AcceptTimer';
import {reverseMap, tokenIdToURI} from '../../../../utils';
import {useOnMountUnmount} from '../../../../hooks';
import {useEMSWrite} from '../../../../ethUtils';
import {styling} from '../../../styling';
import {action} from 'mobx';
import {Icon} from '@blueprintjs/core';

export const NewClaimsRegion = observer(() => {
  useOnMountUnmount(action(() => globalState.onCreatePage = true), action(() => globalState.onCreatePage = false));

  return (
    <>
      {reverseMap(globalState.newClaimEntries, entry => (
        <ClaimEntryRow key={entry.claim.tokenId.toHexString()} {...entry}/>
      ))}
    </>
  );
});

const Region = styled.div`
  width: 100%;
  margin-top: 2rem;
`;

const ClaimEntryRow = ({claim, acceptEnabledTime, foregroundColor, backgroundColor, status}: NewClaimEntry) => {
  const {write: retractClaim} = useEMSWrite('retractClaim', claim.tokenId);

  const image = useMemo(() => tokenIdToURI(claim.tokenId.toBigInt(), foregroundColor, backgroundColor), []);

  return (
    <Container status={status}>
      <LeftRegion>
        <TokenDisplay src={image}/>
        <DescriptionContainer>
        <span>
          <LabelText>Duration: </LabelText>
          <DurationDisplay duration={claim.duration} owner={claim.owner}/>
        </span>
          <span>
          <LabelText>Edit buffer: </LabelText>
            {claim.editBuffer}
        </span>
        </DescriptionContainer>
        <AcceptTimer tokenId={claim.tokenId} acceptEnabledTime={acceptEnabledTime}/>
      </LeftRegion>
      <RetractRegion>
        <ActionButton onClick={() => retractClaim()}>
          <Icon icon="cross"/>
          Retract
        </ActionButton>
      </RetractRegion>
    </Container>
  );
};

const Container = styled.div<{status: NewClaimEntryStatus}>`
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;
  width: 100%;
  margin-bottom: 1.5rem;
  border: 1px solid ${props => props.status === NewClaimEntryStatus.PENDING ? styling.orange : (
          props.status === NewClaimEntryStatus.ACCEPTED ? '#00de1b' : '#ff3333'
  )};
  border-radius: ${styling.minorBorderRadius};
  background-color: ${styling.panelBackground};
  transition: 0.3s all;
`;

const LeftRegion = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
`;

const TokenDisplay = styled.img`
  width: 5rem;
  ${styling.border};
  border-radius: ${styling.minorBorderRadius};
  margin-right: 1rem;
`;

const DescriptionContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const RetractRegion = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 0 1rem;
  border-left: 1px dashed ${styling.orange};
`;

const ActionButton = styled(Button)`
  width: 5rem;
  height: 5rem;
  border-radius: ${styling.minorBorderRadius};
`;
