import React from 'react';
import {emsContractConfig} from '../../ethUtils';
import {LabelText} from './StyledComponents';

export const DurationDisplay = (props: {duration: number, owner: string}) => {
  if (props.owner === emsContractConfig.addressOrName) {
    return <>Forever</>
  } else {
    return (
      <>
        {props.duration}
        <LabelText> {props.duration > 1 ? 'years' : 'year'}</LabelText>
      </>
    );
  }
};
