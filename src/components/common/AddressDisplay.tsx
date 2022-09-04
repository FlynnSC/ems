import React from 'react';
import {useEnsName} from 'wagmi';
import {emsContractConfig} from '../../ethUtils';
import {CollapsedText} from './CollapsedText';

export const AddressDisplay = ({address}: {address: string}) => {
  const isEMSContract = address === emsContractConfig.addressOrName;
  const {data: ensName} = useEnsName({address, enabled: false/*!isEMSContract*/});
  const displayTextOverride = ensName || (isEMSContract && 'EMS Contract');
  return (
    <a href={`https://ropsten.etherscan.io/address/${address}`}>
      <CollapsedText text={address} displayTextOverride={displayTextOverride}/>
    </a>
  );
};
