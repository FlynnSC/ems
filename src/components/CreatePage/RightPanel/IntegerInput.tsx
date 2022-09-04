import React, {useRef} from 'react';
import styled from 'styled-components';
import {Icon} from '@blueprintjs/core';
import {Button} from '../../common/StyledComponents';
import {styling} from '../../styling';

interface IntegerInputProps {
  value: number;
  min: number;
  max: number;
  onChange: (delta: number) => void;
}

export const IntegerInput = (props: IntegerInputProps) => {
  const timeoutRef = useRef(0);

  // Used so that onPress can always access the non-stale version of props.value. Yeah funky hack, I know :P
  const valueRef = useRef(props.value);
  valueRef.current = props.value;

  const onPress = (delta: number) => {
    if (delta === 1 ? valueRef.current < props.max : valueRef.current > props.min) {
      props.onChange(delta);
      // 500ms delay after initial press, then 100ms repeat
      timeoutRef.current = window.setTimeout(() => onPress(delta), timeoutRef.current ? 100 : 500);
    }
  };

  const onPressEnd = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = 0;
  };

  return (
    <Container>
      <Button
        disabled={props.value === props.min}
        onMouseDown={() => onPress(-1)}
        onMouseUp={onPressEnd}
        onMouseLeave={onPressEnd}
      >
        <StyledIcon icon="minus"/>
      </Button>
      <ValueDisplay>{props.value}</ValueDisplay>
      <Button
        disabled={props.value === props.max}
        onMouseDown={() => onPress(1)}
        onMouseUp={onPressEnd}
        onMouseLeave={onPressEnd}
      >
        <StyledIcon icon="plus"/>
      </Button>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  border-radius: ${styling.minorBorderRadius};
  overflow: hidden;
`;

const StyledIcon = styled(Icon)`
  display: flex;
  align-items: center;
`;

const ValueDisplay = styled.div`
  display: flex;
  justify-content: center;
  background-color: ${styling.grey1};
  ${styling.border};
  width: 2rem;
  padding: 0.125rem;
  cursor: default;
`;
