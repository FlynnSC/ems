import React, {MouseEventHandler, useEffect, useState} from 'react';
import styled from 'styled-components';
import {produce} from '../../../utils';
import {creationState} from '../../../state/creationState';
import {observer} from 'mobx-react-lite';
import {action} from 'mobx';
import {styling} from '../../styling';
import {IntegerInput} from '../RightPanel/IntegerInput';

export const CANVAS_LENGTH = 16;
const ONE = BigInt(1);
const BITS_PER_CHUNK = 253;

export const Canvas = observer(() => {
  const [canvasSize, setCanvasSize] = useState(16);
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

  const updateCanvasSize = (delta: number) => setCanvasSize(oldValue => oldValue + delta);

  const logValue = () => {
    const mask253 = (BigInt(1) << BigInt(BITS_PER_CHUNK)) - ONE;
    let value = creationState.tokenId;

    // The total number of chunks will be a smallest power of 2 that can fit the whole map data encoded into field
    // elements 253 bits at a time
    const chunkCount = Math.ceil((canvasSize * canvasSize) / BITS_PER_CHUNK);
    const paddedChunkCount = Math.pow(2, Math.ceil(Math.log2(chunkCount)));
    let str = "[\n";
    for (let i = 0; i < paddedChunkCount; ++i) {
      str += `'0x${(value & mask253).toString(16)}',\n`;
      value >>= BigInt(BITS_PER_CHUNK);
    }

    str += ']';
    console.log(str);
  };

  return (
    <>
      <Row>
        <IntegerInput value={canvasSize} min={4} max={256} onChange={updateCanvasSize}/>
        <button onClick={logValue}>LOG</button>
      </Row>
      <Container onContextMenu={e => e.preventDefault()}>
        <Grid canvasSize={canvasSize}>
          {produce(canvasSize * canvasSize, bitIndex => {
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
    </>
  );
});

const Row = styled.div`
  display: flex;
`;

const Container = styled.div`
  width: 100%;
`;

const Grid = styled.div<{canvasSize: number}>`
  display: grid;
  grid-template-columns: repeat(${props => props.canvasSize}, 1fr);
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
