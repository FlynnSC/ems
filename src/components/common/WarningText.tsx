import React from 'react';
import styled from 'styled-components';
import {styling} from '../styling';
import {Icon} from '@blueprintjs/core';

interface WarningTextProps {
  text: string;
  size?: string;
}

export const WarningText = (props: WarningTextProps) => (
  <Container>
    <WarningIcon icon="warning-sign"/>
    <Text size={props.size}>{props.text}</Text>
    <WarningIcon icon="warning-sign"/>
  </Container>
);

const Container = styled.div`
  display: flex;
  align-items: center;
`;

const WarningIcon = styled(Icon)`
  fill: ${styling.orange};
  transform: translateY(1px);
`;

const Text = styled.div<{size?: string}>`
  margin: 0 0.5rem;
  color: ${styling.orange};
  font-size: ${props => props.size ?? '11px'};
`;
