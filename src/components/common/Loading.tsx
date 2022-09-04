import {RotateLoader} from 'react-spinners';
import React from 'react';
import styled from 'styled-components';

export const Loading = (props: {active: boolean, className?: string}) => props.active ? (
  <LoadingContainer className={props.className}>
    <RotateLoader color="white"/>
  </LoadingContainer>
) : null;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 6rem;
  height: 6rem;
  margin: auto;
`;
