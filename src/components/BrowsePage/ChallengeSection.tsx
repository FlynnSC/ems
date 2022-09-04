import React, {useMemo} from 'react';
import styled from 'styled-components';
import {Claim, getClaimCost} from '../../state/globalState';
import {formatETH, tokenDiffToBytes} from '../../utils';
import {useEMSWrite} from '../../ethUtils';
import {WarningText} from '../common/WarningText';
import {styling} from '../styling';
import {Button} from '../common/StyledComponents';
import {toast} from 'react-toastify';

interface ChallengeSectionProps {
  claim: Claim;
  pending: boolean;
}

export const ChallengeSection = ({claim, pending}: ChallengeSectionProps) => {
  const diffIndices = useMemo(() => tokenDiffToBytes(claim.tokenId, claim.infringement!.tokenId), []);

  const {
    writeAsync,
    isLoading
  } = useEMSWrite('challengeClaim', claim.tokenId, claim.infringement!.tokenId, diffIndices);

  const onChallenge = () => {
    const challengeReward = formatETH(getClaimCost(claim.duration, claim.editBuffer));
    writeAsync().then(tx => tx.wait()).then(() => toast.success(`Challenge successful, earned ${challengeReward}`));
  };

  return (
    <Container pending={pending}>
      <WarningText text="Infringes upon another claim" size="13px"/>
      <ChallengeButton disabled={isLoading} onClick={onChallenge}>
        {isLoading ? 'Waiting' : 'Challenge'}
      </ChallengeButton>
    </Container>
  );
}

const Container = styled.div<{pending: boolean}>`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px dashed ${props => props.pending ? styling.orange : styling.grey3};
`;

const ChallengeButton = styled(Button)`
  padding: 0.5rem 0.75rem;
  margin-left: 2rem;
  border-radius: ${styling.minorBorderRadius};
`;
