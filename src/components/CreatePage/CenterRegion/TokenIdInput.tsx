import React from 'react';
import styled from 'styled-components';
import {creationState} from '../../../state/creationState';
import {action} from 'mobx';
import {observer} from 'mobx-react-lite';
import {TextInput} from '../../common/TextInput';
import {styling} from '../../styling';

export const TokenIdInput = observer(() => {
  const onChange = action((newValueText: string) => {
    try {
      // BigInt(...) throws if the input is invalid
      creationState.makeChange('tokenId', BigInt(newValueText));
      return true;
    } catch (e) {
      return false;
    }
  });

  return (
    <Input value={creationState.tokenId.toString()} onChange={onChange}/>
  );
});

const Input = styled(TextInput)`
  width: 37rem;
  border-top-left-radius: ${styling.minorBorderRadius};
  border-top-right-radius: ${styling.minorBorderRadius};
`;
