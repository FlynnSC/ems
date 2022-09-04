import {Claim} from '../../state/globalState';
import {ClaimLink} from './ClaimLink';
import {toast, ToastOptions} from 'react-toastify';
import React from 'react';

const InfringementToastContent = (props: {claim: Claim}) => (
  <span>
    A claim has been submitted that infringes upon another:
    <ClaimLink claim={props.claim} disablePopup/>
  </span>
);

export function showInfringementToast(claim: Claim, opts?: ToastOptions) {
  toast.warning(<InfringementToastContent claim={claim}/>, opts);
}
