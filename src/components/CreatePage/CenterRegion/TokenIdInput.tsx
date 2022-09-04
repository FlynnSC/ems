import React from 'react';
import styled from 'styled-components';
import {creationState} from '../../../state/creationState';
import {ethers} from 'ethers';
import {action} from 'mobx';
import {observer} from 'mobx-react-lite';
import {TextInput} from '../../common/TextInput';
import {styling} from '../../styling';

const tokenIdToString = (tokenId: bigint) => (
  ethers.utils.hexZeroPad(`0x${tokenId.toString(16)}`, 32)
);

export const TokenIdInput = observer(() => {
  const onChange = action((newValueText: string) => {
    try {
      if (!newValueText.startsWith('0x')) {
        newValueText = `0x${newValueText}`;
      }

      if (newValueText.length > 66) {
        return false;
      }

      // BigInt(...) throws if the input is invalid
      creationState.makeChange('tokenId', BigInt(newValueText));
      return true;
    } catch (e) {
      return false;
    }
  });

  return (
    <Input value={tokenIdToString(creationState.tokenId)} maxLength={66} onChange={onChange}/>
  );
});

const Input = styled(TextInput)`
  width: 37rem;
  border-top-left-radius: ${styling.minorBorderRadius};
  border-top-right-radius: ${styling.minorBorderRadius};
`;
