import React, {MouseEventHandler, useEffect, useState} from 'react';
import styled from 'styled-components';
import {produce} from '../../../utils';
import {creationState} from '../../../state/creationState';
import {observer} from 'mobx-react-lite';
import {action} from 'mobx';
import {styling} from '../../styling';

export const CANVAS_LENGTH = 16;
const ONE = BigInt(1);

export const Canvas = observer(() => {
  const [painting, setPainting] = useState(false);

  const onStartPainting = () => {
    creationState.startChange('tokenId');
    setPainting(true);
  };

  const onEndPainting = () => {
    creationState.endChange('tokenId');
    setPainting(false);
  };

  useEffect(() => {
    const listener = () => {
      if (painting) {
        onEndPainting();
      }
    };
    document.addEventListener('mouseup', listener);
    return () => document.removeEventListener('mouseup', listener);
  }, [painting]);

  return (
    <Container onContextMenu={e => e.preventDefault()}>
      <Grid>
        {produce(CANVAS_LENGTH * CANVAS_LENGTH, bitIndex => {
          const shift = BigInt(bitIndex);
          const isForeground = !!(creationState.tokenId & (ONE << shift));

          const onInput: MouseEventHandler<HTMLDivElement> = action(e => {
            const mask = ONE << shift;
            if (e.buttons === 1) {
              creationState.tokenId |= mask;
            } else if (e.buttons === 2) {
              creationState.tokenId &= ~mask;
            }
          });

          const onMouseDown: MouseEventHandler<HTMLDivElement> = e => {
            e.preventDefault();
            (document.activeElement as HTMLElement)?.blur();
            onStartPainting();
            onInput(e);
          };

          return (
            <Pixel
              key={bitIndex}
              style={{backgroundColor: isForeground ? creationState.foregroundColor : creationState.backgroundColor}}
              draggable={false}
              onMouseDown={onMouseDown}
              onMouseEnter={painting ? onInput : undefined}
            >
              <HighlightOverlay/>
            </Pixel>
          );
        })}
      </Grid>
    </Container>
  );
});

const Container = styled.div`
  width: 100%;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(${CANVAS_LENGTH}, 1fr);
  aspect-ratio: 1/1;
  ${styling.border};
  border-top-width: 0;
  border-bottom-left-radius: ${styling.minorBorderRadius};
  border-bottom-right-radius: ${styling.minorBorderRadius};
  overflow: hidden;
`;

const Pixel = styled.div`
  cursor: crosshair;
`;

const HighlightOverlay = styled.div`
  width: 100%;
  height: 100%;

  &:hover {
    background-color: rgba(128, 128, 128, 0.6);
  }
`;
