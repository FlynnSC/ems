import {CANVAS_LENGTH} from './components/CreatePage/CenterRegion/Canvas';
import {BigNumber, ethers} from 'ethers';
import {Claim} from './state/globalState';
import {formatEther} from 'ethers/lib/utils';

export function produce<T>(count: number, producerFn: (index: number) => T) {
  return Array(count).fill(0).map((_, index) => producerFn(index));
}

const ONE = BigInt(1);

export function tokenIdToSVG(tokenId: bigint, foregroundColor: string, backgroundColor: string) {
  let path = '';
  let mask = BigInt(1);
  for (let y = 0; y < CANVAS_LENGTH; ++y) {
    for (let x = 0; x < CANVAS_LENGTH; ++x) {
      if (tokenId & mask) {
        path += `M${x} ${y} v1 `;
      }
      mask <<= ONE;
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" data-token-id="0x${tokenId.toString(16)}" viewBox="-0.5 0 ${CANVAS_LENGTH} ${CANVAS_LENGTH}" shape-rendering="crispEdges">
       <rect x="-0.5" height="${CANVAS_LENGTH}" width="${CANVAS_LENGTH}" fill="${backgroundColor}"/>
       <path stroke="${foregroundColor}" d="${path}"/>
     </svg>`
  );
}

export function tokenIdToURI(tokenId: bigint, foregroundColor: string, backgroundColor: string) {
  return `data:image/svg+xml;base64,${window.btoa(tokenIdToSVG(tokenId, foregroundColor, backgroundColor))}`;
}

export function calcEditDistance(value1: BigNumber, value2: BigNumber) {
  const valueDiff = value1.xor(value2);
  let editDistance = 0;
  const totalPixelCount = CANVAS_LENGTH * CANVAS_LENGTH;
  for (let index = 0; index < totalPixelCount; ++index) {
    if (!valueDiff.and(ONE << BigInt(index)).eq(ethers.constants.Zero)) {
      ++editDistance;
    }
  }
  return editDistance;
}

export function findClaimInfringement(claim: {tokenId: BigNumber, editBuffer: number}, checkAgainst: Claim[]) {
  let smallestEditDistance = Infinity;
  let infringement: Claim | undefined = undefined;

  // Returns the infringed claim with the smallest edit distance, if one exists
  checkAgainst.forEach(otherClaim => {
    const editDistance = calcEditDistance(claim.tokenId, otherClaim.tokenId);
    if (editDistance < smallestEditDistance && editDistance <= Math.max(claim.editBuffer, otherClaim.editBuffer)) {
      smallestEditDistance = editDistance;
      infringement = otherClaim;
    }
  });
  return infringement;
}

export function tokenDiffToBytes(token1: BigNumber, token2: BigNumber) {
  const list = [];
  let diff = token1.toBigInt() ^ token2.toBigInt();
  for (let index = 0; index < 256; ++index) {
    if (((diff >> BigInt(index)) & ONE) === ONE) {
      list.push(index);
    }
  }
  return Uint8Array.from(list);
}

export function padTokenId(tokenId: BigNumber) {
  return ethers.utils.hexZeroPad(tokenId.toHexString(), 32);
}

export function reverseMap<T, U>(arr: T[], callback: (elem: T, index: number) => U) {
  const newArr = new Array(arr.length);
  for (let i = arr.length - 1; i >= 0; --i) {
    newArr.push(callback(arr[i], i));
  }
  return newArr;
}

export function numberToColorString(num: number) {
  return `#${num.toString(16).padStart(6, '0')}`;
}

export function formatETH(value: BigNumber) {
  return `${formatEther(value).slice(0, 11)} ETH`;
}
