import React from 'react';
import styled from 'styled-components';
import {ColorSelector} from './ColorSelector';
import {tokenIdToSVG} from '../../../utils';
import {creationState} from '../../../state/creationState';
import {observer} from 'mobx-react-lite';
import {useKeyboardListener} from '../../../hooks';
import {Icon} from '@blueprintjs/core';
import {Button} from '../../common/StyledComponents';
import {styling} from '../../styling';

export const LeftPanel = observer(() => {
  // Undo/redo
  useKeyboardListener(e => {
    if (e.key.toLowerCase() === 'z' && e.ctrlKey && document.activeElement?.localName !== 'input') {
      if (e.shiftKey) {
        creationState.redo();
      } else {
        creationState.undo();
      }
    }
  });

  const swapColors = () => {
    const temp = creationState.backgroundColor;
    creationState.makeChange('backgroundColor', creationState.foregroundColor);
    creationState.makeChange('foregroundColor', temp);
  };

  const svg = tokenIdToSVG(creationState.tokenId, creationState.foregroundColor, creationState.backgroundColor);

  return (
    <Container>
      <ButtonContainer>
        <ControlButton disabled={!creationState.canUndo} onClick={() => creationState.undo()}>
          <ControlIcon icon="undo"/>
          Undo
        </ControlButton>
        <ControlButton disabled={!creationState.canRedo} onClick={() => creationState.redo()}>
          <ControlIcon icon="redo"/>
          Redo
        </ControlButton>
        <ControlButton onClick={() => creationState.makeChange('tokenId', BigInt(0))}>
          <ControlIcon icon="delete"/>
          Clear
        </ControlButton>
        <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(svg)}`} download="mark.svg">
          <ControlButton>
            <ControlIcon icon="import"/>
            Download
          </ControlButton>
        </a>
      </ButtonContainer>
      <ColorSelector type="foreground"/>
      <SwapButton disabled={creationState.foregroundColor === creationState.backgroundColor} onClick={swapColors}>
        <Icon icon="swap-vertical"/>
      </SwapButton>
      <ColorSelector type="background"/>
    </Container>
  );
});

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  align-items: center;
`;

const ButtonContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  width: 11rem;
  border-radius: ${styling.minorBorderRadius};
  overflow: hidden;
`;

const ControlButton = styled(Button)`
  width: 100%;
  padding: 1rem 0.5rem;
`;

const ControlIcon = styled(Icon)`
  margin-bottom: 0.25rem;
`;

const SwapButton = styled(Button)`
  width: 2.5rem;
  aspect-ratio: 1/1;
  border-radius: ${styling.minorBorderRadius};
`;
