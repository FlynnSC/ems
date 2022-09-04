import React, {useState} from 'react';
import styled, {css} from 'styled-components';
import {observer} from 'mobx-react-lite';
import {Button, LabelText} from '../../common/StyledComponents';
import {creationState} from '../../../state/creationState';
import {useEMSWrite} from '../../../ethUtils';
import {toast} from 'react-toastify';
import {IntegerInput} from './IntegerInput';
import {styling} from '../../styling';
import {Icon} from '@blueprintjs/core';
import {formatETH} from '../../../utils';
import {useKeyboardListener} from '../../../hooks';
import {WarningText} from '../../common/WarningText';
import {getClaimCost} from '../../../state/globalState';
import {ClaimLink} from '../../common/ClaimLink';

export const RightPanel = observer(() => {
  const [submitOverride, setSubmitOverride] = useState(false);

  useKeyboardListener(e => {
    if (e.key === 'o') {
      setSubmitOverride(currValue => !currValue);
      // showInfringementToast({tokenId: BigNumber.from(tokenId)} as Claim, {
      //   style: {
      //     backgroundColor: styling.panelBackground,
      //     border: styling.border.slice('border: '.length),
      //     borderRadius: styling.minorBorderRadius,
      //     overflow: 'visible',
      //   }
      // });
    }
  });

  const {tokenId, duration, editBuffer, foregroundColor, backgroundColor} = creationState;
  const claimCost = getClaimCost(duration, editBuffer);
  const {writeAsync: submitClaim} = useEMSWrite(
    'submitClaim',
    tokenId,
    duration,
    editBuffer,
    foregroundColor.replace('#', '0x'),
    backgroundColor.replace('#', '0x'),
    {value: claimCost}
  );

  const onSubmit = () => {
    submitClaim().then(tx => toast.promise(tx.wait(), {
      pending: 'Waiting for transaction confirmation',
      success: 'Claim submitted',
      error: 'Transaction failed',
    }));
  };

  const updateEditBuffer = (delta: number) => creationState.makeChange('editBuffer', creationState.editBuffer + delta);
  const updateDuration = (delta: number) => creationState.makeChange('duration', creationState.duration + delta);

  return (
    <Container>
      <Title>Claim creation</Title>
      <Body>
        <Section>
          <StepText>1. Set image, colors, edit buffer and duration</StepText>
          <StepText>2. Submit claim, wait out 60s challenge period</StepText>
          <StepText>3. Accept claim, manage newly acquired token in the 'Manage' tab</StepText>
        </Section>
        <Section>
          <SubSection>
            <Label>Edit buffer:</Label>
            <IntegerInput value={editBuffer} min={0} max={50} onChange={updateEditBuffer}/>
          </SubSection>
          <SubSection>
            <Label>Duration (years):</Label>
            <IntegerInput value={duration} min={1} max={99} onChange={updateDuration}/>
          </SubSection>
          <SubSection>
            <Label>Cost:</Label>
            {formatETH(claimCost)}
          </SubSection>
          {creationState.lastInfringedClaim && (
            <PositioningContainer>
              <OpacityContainer visible={creationState.infringementExists && !submitOverride}>
                <WarningText text="Infringes upon claim:"/>
                <InfringedTokenPreview src={creationState.lastInfringedClaim.image}/>
                <ClaimLink claim={creationState.lastInfringedClaim}/>
              </OpacityContainer>
              <SubmitButton onClick={onSubmit}>
                <Icon icon="arrow-right"/>
                Submit
              </SubmitButton>
            </PositioningContainer>
          )}
        </Section>
      </Body>
    </Container>
  )
});

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 12.75rem;
  height: 100%;
`;

const Title = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 0.5rem 0;
  color: ${styling.grey1};
  background-color: ${styling.grey3};
  border-top-left-radius: ${styling.minorBorderRadius};
  border-top-right-radius: ${styling.minorBorderRadius};
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-grow: 1;
  background-color: ${styling.panelBackground};
  ${styling.border};
  border-top: none;
  border-bottom-left-radius: ${styling.minorBorderRadius};
  border-bottom-right-radius: ${styling.minorBorderRadius};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0.75rem 0;

  &:not(:last-of-type) {
    border-bottom: 1px solid ${styling.grey3};
  }
`;

const StepText = styled(LabelText)`
  color: ${styling.text};
  display: block;
  margin-bottom: 0.75rem;
`;

const SubSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Label = styled(LabelText)`
  display: block;
  margin-bottom: 0.5rem;
`;

const PositioningContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const OpacityContainer = styled.div<{visible: boolean}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  opacity: ${props => props.visible ? '100%' : '0%'};
  transition: opacity 0.1s;

  ${props => props.visible ? '' : css`
    pointer-events: none;
    user-select: none;
  `}
`;

const size = '9rem';

const InfringedTokenPreview = styled.img`
  width: ${size};
  margin: 0.5rem 0;
  ${styling.border};
  border-radius: ${styling.minorBorderRadius};
`;

const SubmitButton = styled(Button)`
  position: absolute;
  top: 28px;
  width: calc(${size} + 2px);
  height: calc(${size} + 1px);
  border-radius: ${styling.minorBorderRadius};
`;
