import React from 'react';
import styled from 'styled-components';
import {observer} from 'mobx-react-lite';
import {ClaimStatus, globalState} from '../../state/globalState';
import {Loading} from '../common/Loading';
import {ClaimRow} from './ClaimRow';
import {styling} from '../styling';

export const BrowsePage = observer(() => {
  const claims = globalState.sortedClaims;
  const pendingClaims = claims.filter(claim => claim.status === ClaimStatus.PENDING);
  const activeClaims = claims.filter(claim => claim.status === ClaimStatus.ACTIVE);

  return (
    <Container>
      <Loading active={claims.length === 0}/>
      {pendingClaims.length > 0 && (
        <Section pending={true}>
          {pendingClaims.map(claim => (
            <ClaimRow key={claim.tokenId.toHexString()} claim={claim}/>
          ))}
        </Section>
      )}
      {activeClaims.length > 0 && (
        <Section pending={false}>
          {activeClaims.map(claim => (
            <ClaimRow key={claim.tokenId.toHexString()} claim={claim}/>
          ))}
        </Section>
      )}
    </Container>
  )
});

const Container = styled.div`
  max-width: 40rem;
  margin: 2rem auto 40rem;
`;

const Section = styled.div<{pending: boolean}>`
  margin-bottom: 2rem;
  border: 1px solid ${props => props.pending ? styling.orange : styling.grey3};
  border-radius: ${styling.majorBorderRadius};
  background-color: ${styling.panelBackground};
`;
