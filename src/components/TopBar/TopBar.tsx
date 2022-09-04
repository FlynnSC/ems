import React, {useEffect} from 'react';
import styled from 'styled-components';
import {ConnectButton} from '@rainbow-me/rainbowkit';
import {Path} from '../App';
import {NavLink} from 'react-router-dom';
import {useAccount, useSigner} from 'wagmi';
import {observer} from 'mobx-react-lite';
import {globalState} from '../../state/globalState';
import {styling} from '../styling';

export const TopBar = observer(() => {
  const {data: signer} = useSigner();
  const {address} = useAccount();

  useEffect(() => {
    if (signer && address) {
      globalState.connect(signer, address!);
    }
  }, [signer, address])

  return (
    <Container>
      <LogoRow>
        <LogoImage src="heart.svg" width="64px"/>
        EMS
      </LogoRow>
      <NavRow>
        {Object.values(Path).map((path) => <NavButton key={path} to={path}>{path}</NavButton>)}
      </NavRow>
      <ButtonContainer>
        <ConnectButton showBalance={false} accountStatus="address" chainStatus="none"/>
      </ButtonContainer>
    </Container>
  );
});

const Container = styled.div`
  position: sticky;
  top: 0;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  z-index: 10;
  background-color: ${styling.grey2};
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  font-size: 2rem;
`;

const LogoImage = styled.img`
  width: 64px;
  margin-right: 1rem;
`;

const NavRow = styled.div`
  display: flex;
  justify-content: center;
`;

const NavButton = styled(NavLink)`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 10rem;
  height: 100%;
  color: ${styling.grey1} !important;
  font-size: 1.5rem;
  background-color: ${styling.grey3};
  text-decoration: none;
  text-transform: capitalize;
  transition: background-color 0.1s !important;

  &:hover {
    cursor: pointer;
    background-color: ${styling.grey4};
  }

  &.active {
    background-color: ${styling.grey4};
  }
`;

const ButtonContainer = styled.div`
  justify-self: right;
  align-self: center;
  padding-right: 1rem;
`;
