import styled from 'styled-components';
import {styling} from '../styling';

export const LabelText = styled.span`
  color: #bdbdbd;
  font-size: 13px;
`;

export const Button = styled.button`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: ${styling.grey1};
  font-family: monospace;
  background-color: ${styling.grey3};
  border: none;
  border-radius: 0;
  transition: background-color 0.1s;

  &:not(:disabled):hover {
    cursor: pointer;
    background-color: ${styling.grey4};
  }

  &:disabled {
    background-color: ${styling.grey2};
  }
`;
