import {action, makeAutoObservable, reaction, runInAction} from 'mobx';
import {BigNumber, Contract, Signer} from 'ethers';
import {emsContractConfig} from '../ethUtils';
import {EMSManagement} from '../../typechain-types';
import {findClaimInfringement, numberToColorString, tokenIdToURI} from '../utils';
import {creationState} from './creationState';
import {showInfringementToast} from '../components/common/InfringementToast';

export enum ClaimStatus {
  INACTIVE,
  PENDING,
  ACTIVE,
}

export interface Claim {
  tokenId: BigNumber;
  owner: string;
  startDate: Date;
  duration: number;
  editBuffer: number;
  index: number;
  status: ClaimStatus;
  image: string; // In data uri form
  foregroundColor: string;
  backgroundColor: string;
  infringement?: Claim;
}

export enum NewClaimEntryStatus {
  PENDING,
  RETRACTED,
  CHALLENGED,
  ACCEPTED,
}

export interface NewClaimEntry {
  claim: Claim;
  acceptEnabledTime: Date;
  foregroundColor: string;
  backgroundColor: string;
  status: NewClaimEntryStatus;
}

class GlobalState {
  signer?: Signer;
  userAddress = '';
  contract = new Contract(emsContractConfig.addressOrName, emsContractConfig.contractInterface) as EMSManagement;
  claims: Record<string, Claim> = {};
  seenEventIds = new Set();

  onCreatePage = false;
  newClaimEntries: NewClaimEntry[] = [];

  durationCostFactor = BigNumber.from(0);
  editBufferCostFactor = BigNumber.from(0);

  constructor() {
    makeAutoObservable(this);

    reaction(
      () => this.onCreatePage,
      () => {
        // Clears non-pending claim entries when leaving the create page
        if (!this.onCreatePage) {
          this.refreshNewClaimEntries();
        }
      })
  }

  async connect(signer: Signer, address: string) {
    this.signer = signer;
    this.userAddress = address;
    this.contract = this.contract.connect(signer);

    this.contract.durationCostFactor().then(action(value => this.durationCostFactor = value));
    this.contract.editBufferCostFactor().then(
      action(value => this.editBufferCostFactor = value)
    );

    const events = await this.contract.queryFilter(this.contract.filters.ClaimSubmitted());
    await Promise.all(events.map(event => this.handleClaimSubmitted(event.args.tokenId)));
    const seenEventIds = new Set(events.map(event => `${event.blockNumber}-${event.logIndex}`));

    this.contract.on(this.contract.filters.ClaimSubmitted(), (a, b, event) => {
      // Prevents event duplication
      if (!seenEventIds.has(`${event.blockNumber}-${event.logIndex}`)) {
        this.handleClaimSubmitted(event.args.tokenId);
      }
    });
    this.contract.on(this.contract.filters.ClaimRetracted(), tokenId => this.handleClaimRetracted(tokenId));
    this.contract.on(this.contract.filters.ClaimChallenged(), tokenId => this.handleClaimChallenged(tokenId));
    this.contract.on(this.contract.filters.ClaimAccepted(), tokenId => this.handleClaimAccepted(tokenId));
  }

  async handleClaimSubmitted(tokenId: BigNumber) {
    const [claimData, tokenConfigData] = await Promise.all([
      this.contract.claims(tokenId),
      this.contract.tokenConfigs(tokenId),
    ]);

    if (claimData.status !== ClaimStatus.INACTIVE) {
      runInAction(() => {
        const foregroundColor = numberToColorString(tokenConfigData.foregroundColor);
        const backgroundColor = numberToColorString(tokenConfigData.backgroundColor);
        const claim = {
          ...claimData,
          startDate: new Date(claimData.startDate * 1000),
          tokenId,
          image: tokenIdToURI(tokenId.toBigInt(), foregroundColor, backgroundColor),
          foregroundColor,
          backgroundColor,
          infringement: findClaimInfringement({tokenId, editBuffer: claimData.editBuffer}, this.sortedClaims),
        };
        this.claims[tokenId.toHexString()] = claim;

        if (claim.infringement) {
          showInfringementToast(claim);
        }

        if (claim.owner === this.userAddress && claim.status === ClaimStatus.PENDING) {
          this.newClaimEntries.push({
            claim,
            acceptEnabledTime: new Date(claim.startDate.getTime() + 60 * 1000),
            foregroundColor: creationState.foregroundColor,
            backgroundColor: creationState.backgroundColor,
            status: NewClaimEntryStatus.PENDING,
          });
        }
      });
    }
  }

  handleClaimRetracted(tokenId: BigNumber) {
    delete this.claims[tokenId.toHexString()];
    this.updateNewClaimEntryStatus(tokenId, NewClaimEntryStatus.RETRACTED);
  }

  handleClaimChallenged(tokenId: BigNumber) {
    delete this.claims[tokenId.toHexString()];
    this.updateNewClaimEntryStatus(tokenId, NewClaimEntryStatus.CHALLENGED);
  }

  handleClaimAccepted(tokenId: BigNumber) {
    this.claims[tokenId.toHexString()].status = ClaimStatus.ACTIVE;
    this.updateNewClaimEntryStatus(tokenId, NewClaimEntryStatus.ACCEPTED);
  }

  updateNewClaimEntryStatus(tokenId: BigNumber, status: NewClaimEntryStatus) {
    if (this.onCreatePage) {
      this.newClaimEntries.forEach(claimEntry => {
        if (claimEntry.claim.tokenId.eq(tokenId)) {
          claimEntry.status = status;
        }
      });
    } else {
      // Removes claim entry if not on the create page
      this.newClaimEntries = this.newClaimEntries.filter(claimEntry => !claimEntry.claim.tokenId.eq(tokenId));
    }
  }

  refreshNewClaimEntries() {
    this.newClaimEntries = this.newClaimEntries.filter(claimEntry => claimEntry.status === NewClaimEntryStatus.PENDING);
  }

  // Reverse chronological order
  get sortedClaims() {
    return Object.values(this.claims).sort((claim1, claim2) => claim2.index - claim1.index);
  }

  get userClaims() {
    return this.sortedClaims.filter(claim => claim.owner === this.userAddress);
  }
}

export const globalState = new GlobalState();

export function getClaimCost(duration: number, editBuffer: number) {
  return globalState.durationCostFactor.add(
    globalState.editBufferCostFactor.mul(BigNumber.from(2).shl(editBuffer))
  ).mul(duration);
}
