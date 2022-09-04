import React from 'react';
import {Claim} from '../../state/globalState';
import {Path} from '../App';
import {padTokenId} from '../../utils';
import {CollapsedText, collapseText} from './CollapsedText';
import {Link} from 'react-router-dom';

interface ClaimLinkProps {
  claim: Claim;
  disablePopup?: boolean;
}

export const ClaimLink = (props: ClaimLinkProps) => {
  const paddedTokenId = padTokenId(props.claim.tokenId);
  return (
    <Link to={`/${Path.BROWSE}?tokenId=${paddedTokenId}`}>
      {props.disablePopup ? collapseText(paddedTokenId) : (
        <CollapsedText text={paddedTokenId}/>
      )}
    </Link>
  );
};
