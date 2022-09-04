import React, {useEffect, useRef, useState} from 'react';
import styled from 'styled-components';
import {Claim, ClaimStatus} from '../../state/globalState';
import {AddressDisplay} from '../common/AddressDisplay';
import {padTokenId} from '../../utils';
import {CopyContainer} from '../common/CopyContainer';
import {LabelText} from '../common/StyledComponents';
import {useSearchParams} from 'react-router-dom';
import {DurationDisplay} from '../common/DurationDisplay';
import {styling} from '../styling';
import {ChallengeSection} from './ChallengeSection';

interface ClaimRowProps {
  claim: Claim;
}

export const ClaimRow = ({claim}: ClaimRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const scrollTargetRef = useRef<HTMLImageElement>(null);
  const [searchParams] = useSearchParams();

  const toggleExpanded = () => {
    if (!expanded && scrollTargetRef.current) {
      scrollTargetRef.current?.scrollIntoView({behavior: 'smooth', block: 'center'});
    }
    setExpanded(!expanded);
  };

  useEffect(() => {
    if (searchParams.get('tokenId') === padTokenId(claim.tokenId)) {
      toggleExpanded();
    }
  }, []);

  return (
    <Container pending={claim.status === ClaimStatus.PENDING}>
      <ScrollTarget ref={scrollTargetRef}/>
      {claim.infringement && <ChallengeSection claim={claim} pending={claim.status === ClaimStatus.PENDING}/>}
      <ContentContainer>
        <TokenDisplay src={claim.image} expanded={expanded} onClick={toggleExpanded}/>
        <DescriptionContainer expanded={expanded}>
          <DescriptionRow>
          <span>
            <LabelText>Owner: </LabelText>
            <AddressDisplay address={claim.owner}/>
          </span>
            <span>
            <LabelText>TokenId: </LabelText>
            <CopyContainer text={padTokenId(claim.tokenId)} collapseText={true}/>
          </span>
          </DescriptionRow>
          <DescriptionRow>
          <span>
            <LabelText>Colors: </LabelText>
            <CopyContainer text={claim.foregroundColor}/>
            <LabelText> / </LabelText>
            <CopyContainer text={claim.backgroundColor}/>
          </span>
            <span>
            <LabelText>Edit buffer: </LabelText>
              {claim.editBuffer}
          </span>
          </DescriptionRow>
          <DescriptionRow>
          <span>
            <LabelText>Claim start: </LabelText>
            {claim.startDate.toDateString()}
          </span>
            <span>
            <LabelText>Duration: </LabelText>
            <DurationDisplay duration={claim.duration} owner={claim.owner}/>
          </span>
          </DescriptionRow>
        </DescriptionContainer>
      </ContentContainer>
    </Container>
  );
};

const Container = styled.div<{pending: boolean}>`
  &:not(:last-of-type) {
    border-bottom: 1px solid ${props => props.pending ? styling.orange : styling.grey3};
  }
`;

const ScrollTarget = styled.div`
  position: absolute;
  top: 30rem;
`;

const ContentContainer = styled.div`
  position: relative;
  display: flex;
  padding: 1rem;
`;

const TokenDisplay = styled.img<{expanded: boolean}>`
  width: ${props => props.expanded ? '40rem' : '7rem'};
  ${styling.border};
  margin-bottom: ${props => props.expanded ? '8rem' : '0'};
  cursor: pointer;
  z-index: 1;
  border-radius: ${props => props.expanded ? '0.5rem' : styling.minorBorderRadius};
  transition: all 0.3s;

  &:hover {
    border-color: ${styling.orange};
  }
`;

const DescriptionContainer = styled.div<{expanded: boolean}>`
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: ${props => props.expanded ? '37rem' : '30rem'};
  height: 7rem;
  box-sizing: border-box;
  padding: 0.25rem 0;
  margin-left: ${props => props.expanded ? '0.5rem' : '8rem'};
  bottom: 1rem;
  transition: all 0.3s;
  font-size: 14px;
`;

const DescriptionRow = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 2.5rem;
  width: 100%;
`;
