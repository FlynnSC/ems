import React, {useRef} from 'react';
import styled from 'styled-components';
import {observer} from 'mobx-react-lite';
import {action} from 'mobx';
import {creationState} from '../../../state/creationState';
import {startCase} from 'lodash';
import {TextInput} from '../../common/TextInput';
import {useOnMount} from '../../../hooks';
import {HexColorPicker} from 'react-colorful';
import {styling} from '../../styling';

const isValidColor = (color: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);

interface ColorSelectorProps {
  type: 'foreground' | 'background';
}

// TODO Implement prevention/warning for choosing the same color for both foreground and background
export const ColorSelector = observer((props: ColorSelectorProps) => {
  const pickerContainerRef = useRef<HTMLDivElement>(null);
  const pickerSelectedRef = useRef(false);

  const stateKey: 'foregroundColor' | 'backgroundColor' = `${props.type}Color`
  const colorValue = creationState[stateKey];

  useOnMount(() => {
    const picker = pickerContainerRef.current!;
    picker.addEventListener('mousedown', () => {
      pickerSelectedRef.current = true;
      creationState.startChange(stateKey);
    });
    const mouseUpListener = () => {
      if (pickerSelectedRef.current) {
        pickerSelectedRef.current = false;
        creationState.endChange(stateKey);
      }
    };
    document.addEventListener('mouseup', mouseUpListener);
    return () => document.removeEventListener('mouseup', mouseUpListener);
  });

  const onTextChange = (newColor: string) => {
    if (isValidColor(newColor)) {
      creationState.makeChange(stateKey, newColor);
      return true;
    }
    return false;
  };

  const onPickerChange = action((newColor: string) => creationState[stateKey] = newColor);

  return (
    <Container>
      <Row>
        <Label>{startCase(props.type)}:</Label>
        <Input value={colorValue} maxLength={7} onChange={onTextChange}/>
      </Row>
      <PickerContainer ref={pickerContainerRef}>
        <HexColorPicker color={colorValue} onChange={onPickerChange}/>
      </PickerContainer>
    </Container>
  );
});

const Container = styled.div`

`;

const Row = styled.div`
  display: flex;
  justify-content: right;
  align-items: center;
  background-color: ${styling.grey3};
  position: relative;
  border-top-left-radius: ${styling.minorBorderRadius};
  border-top-right-radius: ${styling.minorBorderRadius};
`;

const Label = styled.div`
  color: ${styling.grey1};
  font-size: 13px;
`;

const Input = styled(TextInput)`
  width: 4.5rem;
  margin-left: 0.4rem;
  border-top-right-radius: ${styling.minorBorderRadius};
`;


const PickerContainer = styled.div`
  .react-colorful {
    width: 11rem; // TODO come back here bruh
    height: 10.5rem;
    cursor: pointer;
    box-sizing: border-box;
    ${styling.border};
    border-top: none;
    border-bottom-left-radius: ${styling.minorBorderRadius};
    border-bottom-right-radius: ${styling.minorBorderRadius};
    overflow: hidden;
  }

  .react-colorful__pointer {
    width: 12px;
    height: 12px;
  }

  .react-colorful__hue {
    border-radius: 0;
  }

  .react-colorful__saturation {
    border-radius: 0;
    border: none;
  }
`;
