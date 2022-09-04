import React, {useState} from 'react';
import styled from 'styled-components';
import {styling} from '../styling';

export const collapseText = (text: string) => (
  `${text.slice(0, 5)}...${text.slice(-3)}`
);

export const CollapsedText = (props: {text: string, displayTextOverride?: string | false}) => {
  const [popoverVisible, setPopoverVisible] = useState(false);
  const displayText = props.displayTextOverride || collapseText(props.text);

  return (
    <Container>
      <span onMouseEnter={() => setPopoverVisible(true)} onMouseLeave={() => setPopoverVisible(false)}>
        {displayText}
      </span>
      <Popover visible={popoverVisible}>
        {props.text}
        <PopoverArrow/>
      </Popover>
    </Container>
  );
};

const Container = styled.span`
  position: relative;
`;

const Popover = styled.div<{visible: boolean}>`
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  user-select: none;
  pointer-events: none;
  opacity: ${props => props.visible ? '100%' : '0%'};
  transition: opacity 0.2s;
  background-color: ${styling.grey1};
  color: #d3d3d3;
  border-radius: ${styling.minorBorderRadius};
  padding: 0.125rem 0.25rem;
  z-index: 2;
`;

const PopoverArrow = styled.div`
  position: absolute;
  width: 0;
  border-top: 0.5rem solid ${styling.grey1};
  border-left: 0.5rem solid transparent;
  border-right: 0.5rem solid transparent;
  top: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
`;
