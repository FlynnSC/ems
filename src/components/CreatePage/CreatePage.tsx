import React from 'react';
import styled, {css} from 'styled-components';
import {LeftPanel} from './LeftPanel/LeftPanel';
import {RightPanel} from './RightPanel/RightPanel';
import {TokenIdInput} from './CenterRegion/TokenIdInput';
import {Canvas} from './CenterRegion/Canvas';
import {NewClaimsRegion} from './CenterRegion/NewClaimsRegion/NewClaimsRegion';

export const CreatePage = () => (
  <Grid>
    <Region alignment="flex-end">
      <LeftPanel/>
    </Region>
    <Region alignment="center">
      <TokenIdInput/>
      <Canvas/>
    </Region>
    <Region alignment="flex-start">
      <RightPanel/>
    </Region>
    <Region alignment="center">
      <NewClaimsRegion/>
    </Region>
  </Grid>
);

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  padding-top: 2rem;
`;

const Region = styled.div<{alignment: 'flex-start' | 'flex-end' | 'center'}>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.alignment};
  ${props => props.alignment === 'center' ? css`
    grid-column-start: 2;
  ` : ''}
`;
