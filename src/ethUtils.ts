import {UseContractConfig} from 'wagmi/dist/declarations/src/hooks/contracts/useContract';
import emsArtifact from './artifacts/contracts/EMSManagement.sol/EMSManagement.json';
import {useContractEvent, useContractRead, useContractWrite} from 'wagmi';
import {EMSManagement} from '../typechain-types';

export const emsContractConfig: UseContractConfig = {
  addressOrName: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  contractInterface: emsArtifact.abi,
};

export const useEMSRead = <FunctionName extends keyof EMSManagement['functions']>(
  functionName: FunctionName,
  ...args: Parameters<EMSManagement[FunctionName]>
) => {
  const {data, ...rest} = useContractRead({...emsContractConfig, functionName, args});
  const typedData = data as Awaited<ReturnType<EMSManagement[FunctionName]>> | undefined;
  return {data: typedData, ...rest}
};

export const useEMSWrite = <FunctionName extends keyof EMSManagement['functions']>(
  functionName: FunctionName,
  ...args: Parameters<EMSManagement[FunctionName]>
) => {
  const {data, ...rest} = useContractWrite({...emsContractConfig, functionName, args});
  const typedData = data as Awaited<ReturnType<EMSManagement[FunctionName]>> | undefined;
  return {data: typedData, ...rest}
};

export const useEMSEvent = <EventName extends keyof EMSManagement['filters']>(
  eventName: EventName,
  listener: (...args: Parameters<EMSManagement['filters'][EventName]>) => void
) => {
  useContractEvent({...emsContractConfig, eventName, listener: listener as Parameters<EMSManagement['on']>[1]});
};
