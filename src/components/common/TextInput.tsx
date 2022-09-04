import styled from 'styled-components';
import {useEffect, useState} from 'react';
import {styling} from '../styling';

interface TextInputProps {
  value: string;
  maxLength?: number;
  onChange: (newValue: string) => boolean; // Returns whether the change is valid or not
  className?: string
}

export const TextInput = (props: TextInputProps) => {
  const [textValue, setTextValue] = useState(props.value);
  const [focussed, setFocussed] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!focussed) {
      setTextValue(props.value);
    }
  }, [props.value]);

  const onChange = (newValue: string) => {
    setTextValue(newValue);
    const wasValidChange = props.onChange(newValue);
    setInvalid(!wasValidChange);
  };

  const onBlur = () => {
    setTextValue(props.value);
    setInvalid(false);
    setFocussed(false);
  };

  return (
    <Input
      value={textValue}
      invalid={invalid}
      maxLength={props.maxLength}
      className={props.className}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocussed(true)}
      onBlur={onBlur}
    />
  );
};

const Input = styled.input<{invalid: boolean}>`
  color: #c9c9c9;
  font-size: 16px;
  font-family: monospace;
  background-color: ${styling.grey1};
  ${styling.border};
  padding: 0.125rem 0.25rem;
  text-align: center;
  outline: none;
  transition: border-color 0.1s;

  &:focus {
    border-color: ${props => props.invalid ? 'red' : styling.orange};
  }
`;
