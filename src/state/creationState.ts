import {autorun, makeAutoObservable, runInAction} from 'mobx';
import {BigNumber} from 'ethers';
import {Claim, globalState} from './globalState';
import {findClaimInfringement} from '../utils';

type StateKey = 'tokenId' | 'foregroundColor' | 'backgroundColor' | 'duration' | 'editBuffer';

interface Change {
  key: StateKey;
  from: any;
  to: any;
}

class CreationState {
  tokenId = BigInt(0);
  foregroundColor = '#000000';
  backgroundColor = '#565555'; // '#ffffff';
  duration = 1;
  editBuffer = 5;

  changeHistory: Change[] = [];
  changeIndex = 0;
  changeActive = false;

  infringementExists = false;
  lastInfringedClaim?: Claim;

  constructor() {
    makeAutoObservable(this);

    autorun(() => {
      const claim = {tokenId: BigNumber.from(this.tokenId), editBuffer: this.editBuffer};
      const infringement = findClaimInfringement(claim, globalState.sortedClaims);
      runInAction(() => {
        this.infringementExists = !!infringement;
        this.lastInfringedClaim = infringement ?? this.lastInfringedClaim;
      });
    });
  }

  makeChange(key: StateKey, value: any) {
    this.startChange(key);
    (this as any)[key] = value;
    this.endChange(key);
  }

  startChange(key: StateKey) {
    this.changeActive = true;
    this.changeHistory[this.changeIndex] = {key, from: this[key], to: null};

    if (this.changeHistory.length > this.changeIndex + 1) {
      this.changeHistory = this.changeHistory.slice(0, this.changeIndex + 1);
    }
  }

  endChange(key: StateKey) {
    this.changeActive = false;
    this.changeHistory[this.changeIndex].to = this[key];
    ++this.changeIndex;
  }

  undo() {
    if (this.canUndo && !this.changeActive) {
      --this.changeIndex;
      const change = this.changeHistory[this.changeIndex];
      (this as any)[change.key] = change.from;
    }
  }

  redo() {
    if (this.canRedo && !this.changeActive) {
      const change = this.changeHistory[this.changeIndex];
      (this as any)[change.key] = change.to;
      ++this.changeIndex;
    }
  }

  get canUndo() {
    return this.changeIndex > 0;
  }

  get canRedo() {
    return this.changeIndex < this.changeHistory.length && this.changeHistory[this.changeIndex].to !== null;
  }
}

export const creationState = new CreationState();
