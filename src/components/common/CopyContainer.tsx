import React, {useState} from 'react';
import styled from 'styled-components';
import {Icon} from '@blueprintjs/core';
import {CollapsedText} from './CollapsedText';
import {styling} from '../styling';

export const CopyContainer = (props: {text: string, collapseText?: boolean}) => {
  const [copied, setCopied] = useState(false);
  const onClick = () => {
    if (!copied) {
      navigator.clipboard.writeText(props.text).catch(console.error);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Container onClick={onClick}>
      <CopiedContainer visible={copied}>
        <CopiedMessage>Copied</CopiedMessage>
        <StyledIcon icon="tick" size={12}/>
      </CopiedContainer>
      <TransitionContainer visible={!copied}>
        {props.collapseText ? <CollapsedText text={props.text}/> : props.text}
        <StyledIcon icon="duplicate" size={12}/>
      </TransitionContainer>
    </Container>
  );
};

const Container = styled.span`
  position: relative;
  cursor: pointer;
  fill: #a4a4a4;
  transition: all 0.1s;

  &:hover {
    color: ${styling.textHighlight};
    fill: ${styling.orange};
  }
`;

const TransitionContainer = styled.span<{visible: boolean}>`
  opacity: ${props => props.visible ? '100%' : '0%'};
  transition: opacity 0.2s;
`;

const CopiedContainer = styled(TransitionContainer)`
  display: flex;
  justify-content: right;
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
`;

const StyledIcon = styled(Icon)`
  display: inline-block;
  margin-left: 0.25rem;
  transform: translateY(1px);
`;

const CopiedMessage = styled.span`
  user-select: none;
  margin-right: calc(50% - 2rem);
`;
