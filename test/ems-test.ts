import {expect} from 'chai';
import {ethers} from 'hardhat';
import {BigNumber} from 'ethers';
import {EMSManagement, EMSManagement__factory} from '../typechain-types';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';

enum ClaimStatus {
  INACTIVE,
  PENDING,
  ACTIVE,
}

interface Claim {
  owner: string;
  startDate: number;
  duration: number;
  editBuffer: number;
  index: number;
  status: ClaimStatus;
}

const tokenId = BigNumber.from('0x8bc1ca41ea41aa5fba419a419a5f0000000000000000');
const tokenIdDiff1 = BigNumber.from('0x8bc1ca41ea41aa5fba419a419adf0000000000000000');
const tokenIdDiff2 = BigNumber.from('0x8bc1ca41ea41aa5fba419a419bdf0000000000000000');
const tokenIdDiff5 = BigNumber.from('0x800000000000000000408bc1ca41ea41aa5fba419a419bdf0000000000000001');
const tokenIdDiff7 = BigNumber.from('0x800000000004000000408bc1ca41ea41aa5fba419a419bdf0000000010000001');
const tokenIdDiff10 = BigNumber.from('0x800000000844000000408bc1ca41ea41aa5fba419a419bdf0000000010400001');
const tokenIdDiff15 = BigNumber.from('0x800000000844000000408bc9ca41ea41aadfba45da419bdf0800000010400001');
const tokenIdDiff20 = BigNumber.from('0x810000100844000040408bc9ca41ea41aadfba45da419bdf0800800810400001');
const tokenIdDiff30 = BigNumber.from('0x810100110a44000040408bc9cb41ea4daadffa45db419bdf0800810810400011');

const foregroundColor = '0x000000';
const backgroundColor = '0xffffff';

let emsFactory: EMSManagement__factory;
let mainAddress: SignerWithAddress;
let otherAddress: SignerWithAddress;
let ems: EMSManagement;

const submitClaim = async (
  {claimTokenId = tokenId, duration = 1, editBuffer = 1, address = mainAddress, awaitTx = true} = {}
) => {
  const cost = await ems.getClaimCost(duration, editBuffer);
  const txPromise = ems.connect(address).submitClaim(
    claimTokenId,
    duration,
    editBuffer,
    foregroundColor,
    backgroundColor,
    {value: cost}
  );
  return awaitTx ? txPromise.then(tx => tx.wait()) : txPromise;
}

const submitAndAcceptClaim = async (
  {claimTokenId = tokenId, duration = 1, editBuffer = 1, address = mainAddress} = {}
) => {
  await submitClaim({claimTokenId, duration, editBuffer, address});
  await advancePastChallengePeriod();
  await ems.acceptClaim(claimTokenId);
};

const checkClaimEquality = async (tokenId: BigNumber, expected: Claim) => {
  const claim = await ems.claims(tokenId);
  Object.entries(expected).forEach(([key, expectedValue]) => {
    expect(claim[key as any]).to.equal(expectedValue);
  });
};

const checkClaimWasDeleted = async (tokenId: BigNumber) => await checkClaimEquality(tokenId, {
  owner: ethers.constants.AddressZero,
  startDate: 0,
  duration: 0,
  editBuffer: 0,
  index: 0,
  status: ClaimStatus.INACTIVE,
});

const advanceTime = async (amount: BigNumber) => {
  const block = await ethers.provider.getBlock(ethers.provider.getBlockNumber());
  await ethers.provider.send('evm_mine', [block.timestamp + amount.toNumber() + 1]);
};

const advancePastChallengePeriod = async () => advanceTime(await ems.claimChallengePeriod());
const advancePastClaimDuration = async (duration: number) => advanceTime((await ems.claimTimeUnit()).mul(duration));

// TODO:
// Add tests for token rendering, config updating and default colors logic
// Add test for claim expiration and then claim on top
// Update submitClaim test and ui code
describe('EMSManagement', () => {
  before(async () => {
    emsFactory = await ethers.getContractFactory('EMSManagement');
    [mainAddress, otherAddress] = await ethers.getSigners();
  });

  beforeEach(async () => {
    ems = await emsFactory.deploy();
    await ems.deployed();
  });


  describe('Deployment', () => {
    it('First two tokens are claimed by the contract itself', async () => {
      const tokensIds = [ethers.constants.Zero, ethers.constants.MaxUint256];
      await Promise.all(tokensIds.map(async (tokenId, index) => {
        // Events were emitted
        expect(await ems.queryFilter(ems.filters.ClaimSubmitted(tokenId, ems.address))).to.have.lengthOf(1);
        expect(await ems.queryFilter(ems.filters.ClaimAccepted(tokenId))).to.have.lengthOf(1);

        const block = await ethers.provider.getBlock(ethers.provider.getBlockNumber());

        // Claim was saved correctly
        await checkClaimEquality(tokenId, {
          owner: ems.address,
          startDate: block.timestamp,
          duration: BigNumber.from('0xffff').toNumber(), // Max uint16
          editBuffer: 0,
          index,
          status: ClaimStatus.ACTIVE,
        });
      }));
    });
  });


  describe('Submitting a claim', () => {
    it('Successful claim submission', async () => {
      const duration = 1;
      const editBuffer = 1;

      // Completed without throwing and emitted event correctly
      const value = await ems.getClaimCost(duration, editBuffer);
      await expect(ems.submitClaim(tokenId, duration, editBuffer, foregroundColor, backgroundColor, {value}))
        .to.emit(ems, 'ClaimSubmitted').withArgs(tokenId, mainAddress.address);

      const block = await ethers.provider.getBlock(ethers.provider.getBlockNumber());

      // Claim data has been stored correctly
      await checkClaimEquality(tokenId, {
        owner: mainAddress.address,
        startDate: block.timestamp,
        duration,
        editBuffer,
        index: 2, // First two claims go to the contract
        status: ClaimStatus.PENDING,
      });

      // currClaimIndex has been incremented
      expect(await ems.currClaimIndex()).to.equal(BigNumber.from(3));
    });

    it('Revert due to insufficient payment', async () => {
      await expect(ems.submitClaim(tokenId, 1, 1, 0, 0)).to.be.revertedWith('Insufficient payment for claim');
    });

    it('Revert due to preexisting claim', async () => {
      await submitClaim();

      // Preexisting pending claim
      await expect(submitClaim({address: otherAddress})).to.be.revertedWith('Claim on this token already exists');

      await advancePastChallengePeriod();
      await ems.acceptClaim(tokenId);

      // Preexisting active claim
      await expect(submitClaim({address: otherAddress})).to.be.revertedWith('Claim on this token already exists');
    });
  });


  describe('Retracting a claim', () => {
    it('Successful claim retraction within the challenge period', async () => {
      const duration = 1;
      const editBuffer = 1;

      await submitClaim({duration, editBuffer});
      const txPromise = ems.retractClaim(tokenId);
      await expect(txPromise).to.emit(ems, 'ClaimRetracted').withArgs(tokenId);

      // Received refund
      const refundAmount = await ems.getClaimCost(duration, editBuffer);
      await expect(await txPromise).to.changeEtherBalance(mainAddress, refundAmount);

      await checkClaimWasDeleted(tokenId);
    });

    it('Successful claim retraction after the challenge period has ended', async () => {
      await submitClaim();
      await advancePastChallengePeriod();
      await ems.acceptClaim(tokenId);

      const txPromise = ems.retractClaim(tokenId);
      await expect(txPromise).to.emit(ems, 'ClaimRetracted').withArgs(tokenId);

      // No refund given
      await expect(await txPromise).to.changeEtherBalance(mainAddress, 0);

      await checkClaimWasDeleted(tokenId);
    });

    it('Revert on trying to retract an inactive claim', async () => {
      await expect(ems.retractClaim(tokenId)).to.revertedWith('Cannot retract inactive claim');
    });

    it(`Revert on trying to retract someone else's pending/active claim`, async () => {
      await submitClaim();
      await expect(ems.connect(otherAddress).retractClaim(tokenId)).to.revertedWith('Not the owner of this claim');
    });

    it(`Successful retraction of someone else's claim that has expired`, async () => {
      const duration = 1;
      await submitClaim({duration});
      await advancePastChallengePeriod();
      await ems.acceptClaim(tokenId);
      await advancePastClaimDuration(duration);

      const txPromise = ems.connect(otherAddress).retractClaim(tokenId);
      await expect(txPromise).to.emit(ems, 'ClaimRetracted').withArgs(tokenId);

      // No refund given
      await expect(await txPromise).to.changeEtherBalance(otherAddress, 0);

      await checkClaimWasDeleted(tokenId);
    });
  });


  describe('Accepting a claim', () => {
    it('Successfully accepting a claim', async () => {
      await submitClaim();
      await advancePastChallengePeriod();
      await expect(ems.acceptClaim(tokenId)).to.emit(ems, 'ClaimAccepted').withArgs(tokenId);

      const claim = await ems.claims(tokenId);
      expect(claim.status).to.equal(ClaimStatus.ACTIVE);
    });

    it('Revert on trying to accept a claim that is not pending', async () => {
      // Inactive claim
      await expect(ems.acceptClaim(tokenId)).to.revertedWith('No pending claim on the supplied tokenId');

      await submitAndAcceptClaim();

      // Active claim
      await expect(ems.acceptClaim(tokenId)).to.revertedWith('No pending claim on the supplied tokenId');
    });

    it('Revert on trying to accept a claim that is still in the challenge period', async () => {
      await submitClaim();
      await expect(ems.acceptClaim(tokenId)).to.revertedWith('Claim still within the challenge period');
    });
  });


  describe('Challenging a claim', () => {
    it('Successfully challenging a claim', async () => {
      const duration = 1;
      const editBuffer = 1;
      await submitAndAcceptClaim({duration, editBuffer});

      // Token that doesn't yet have a claim, but infringes upon the claim created above
      await submitClaim({claimTokenId: tokenIdDiff1, address: otherAddress});

      const diffIndices = await ems.getDiffIndices(tokenId, tokenIdDiff1);
      const txPromise = ems.challengeClaim(tokenIdDiff1, tokenId, diffIndices);
      await expect(txPromise).to.emit(ems, 'ClaimChallenged').withArgs(tokenIdDiff1, mainAddress.address);

      // Challenger was transferred the challenged claim's deposit
      const challengerReward = await ems.getClaimCost(duration, editBuffer);
      await expect(await txPromise).to.changeEtherBalance(mainAddress, challengerReward);

      await checkClaimWasDeleted(tokenIdDiff1);
    });

    it('Revert on submitting a challenge where the infringed token has no active claim upon it', async () => {
      await submitClaim({claimTokenId: tokenIdDiff1, address: otherAddress});

      // Inactive infringed claim
      await expect(ems.challengeClaim(tokenIdDiff1, tokenId, new Uint8Array()))
        .to.revertedWith('No active claim on the infringed token');

      await submitClaim({claimTokenId: tokenId, address: mainAddress});

      // Pending infringed claim
      await expect(ems.challengeClaim(tokenIdDiff1, tokenId, new Uint8Array()))
        .to.revertedWith('No active claim on the infringed token');
    });

    it('Revert on challenging a claim that was created before the infringed token', async () => {
      await submitClaim();
      await submitClaim({claimTokenId: tokenIdDiff1, address: otherAddress});
      await advancePastChallengePeriod();
      await ems.acceptClaim(tokenIdDiff1);

      await expect(ems.challengeClaim(tokenId, tokenIdDiff1, new Uint8Array()))
        .to.revertedWith('Claim upon the infringed token was not made before the claim upon the challenged token');
    });

    it('Revert on trying challenge a token that is the same as the passed infringed upon token', async () => {
      await submitClaim();
      await advancePastChallengePeriod();
      await ems.acceptClaim(tokenId);

      await expect(ems.challengeClaim(tokenId, tokenId, new Uint8Array()))
        .to.revertedWith('Claim upon the infringed token was not made before the claim upon the challenged token');
    });

    it('Revert on providing more diff indices than the editBuffer of both claims', async () => {
      await submitAndAcceptClaim({claimTokenId: tokenId, editBuffer: 1});

      await submitClaim({claimTokenId: tokenIdDiff1, address: otherAddress, editBuffer: 2});

      // 3 diffIndices entries, greater than editBuffers of 1 and 2
      await expect(ems.challengeClaim(tokenIdDiff1, tokenId, new Uint8Array([1, 2, 3])))
        .to.revertedWith('Invalid challenge: too many diffIndices entries');
    });

    it('Revert on providing diffIndices that does not prove infringement', async () => {
      await submitAndAcceptClaim({claimTokenId: tokenId, editBuffer: 5});

      await submitClaim({claimTokenId: tokenIdDiff5, address: otherAddress, editBuffer: 5});

      const diffIndices = ethers.utils.arrayify(await ems.getDiffIndices(tokenId, tokenIdDiff5));
      diffIndices[0] += 1; // Make the diffIndices incorrect

      await expect(ems.challengeClaim(tokenIdDiff5, tokenId, diffIndices))
        .to.revertedWith('Invalid challenge: provided diffIndices does not prove infringement');
    });

    it(`Challenge is still successful when the challenged claim is within the infringed claim's editBuffer, but not ` +
      'vice versa',
      async () => {
        await submitAndAcceptClaim({claimTokenId: tokenId, editBuffer: 5});

        await submitClaim({claimTokenId: tokenIdDiff5, address: otherAddress, editBuffer: 1});

        await expect(ems.challengeClaim(tokenIdDiff5, tokenId, await ems.getDiffIndices(tokenIdDiff5, tokenId)))
          .to.emit(ems, 'ClaimChallenged');
      }
    );

    it(
      `Challenge is still successful when the infringed claim is within the challenged claim's editBuffer, but not ` +
      'vice versa',
      async () => {
        await submitAndAcceptClaim({claimTokenId: tokenId, editBuffer: 1});

        await submitClaim({claimTokenId: tokenIdDiff5, address: otherAddress, editBuffer: 5});

        await expect(ems.challengeClaim(tokenIdDiff5, tokenId, await ems.getDiffIndices(tokenIdDiff5, tokenId)))
          .to.emit(ems, 'ClaimChallenged');
      }
    );
  });


  describe(`Extending a claim's duration`, () => {
    it('Successfully extending claim duration', async () => {
      const duration = 1;
      await submitAndAcceptClaim({duration});

      const extension = 4;
      await ems.extendClaimDuration(tokenId, extension);

      const claim = await ems.claims(tokenId);
      expect(claim.duration).to.equal(duration + extension);
    });

    it('Revert on trying to extend the duration on a non-existent claim', async () => {
      await expect(ems.extendClaimDuration(tokenId, 5)).to.be.revertedWith('No active claim on supplied token');
    });

    it(`Revert on trying to extend a claim's duration by an amount that would overflow the uint16`, async () => {
      await submitAndAcceptClaim({duration: 2 ** 16 - 1}); // Max duration value (uint16)

      await expect(ems.extendClaimDuration(tokenId, 1)).to.be.reverted;
    })
  });


  // it('Test token functions', async () => {
  //   // let thing = []
  //   // for (let i = 0; i < 64; ++i) {
  //   //   thing.push(toBinaryStr(BigNumber.from(i), 6));
  //   // }
  //   // console.log(thing);
  //   // thing = thing.map(elem => countBits(elem));
  //   // console.log(thing);
  //   // thing = thing.map(elem => toBinaryStr(BigNumber.from(elem), 3));
  //   // console.log(thing);
  //   // console.log(thing.reverse().join(''));
  //
  //   const EMS = await ethers.getContractFactory('EMSManagement');
  //   const ems = await EMS.deploy();
  //   await ems.deployed();
  //
  //   const claimCost1 = await ems.getClaimCost(1, 1);
  //   await ems.submitClaim(tokenId, 1, 1, {value: claimCost1}).then(tx => tx.wait());
  //   const currTimestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
  //   await ethers.provider.send('evm_mine', [currTimestamp + secondsInADay + 1]);
  //   await ems.acceptClaim(tokenId).then(tx => tx.wait());
  //
  //   const claimCost2 = await ems.getClaimCost(1, 30);
  //   console.log(ethers.utils.formatEther(claimCost2));
  //   const gasValues = await Promise.all(
  //     [tokenIdDiff1, tokenIdDiff2, tokenIdDiff5, tokenIdDiff7, tokenIdDiff10, tokenIdDiff15, tokenIdDiff20, tokenIdDiff30].map(
  //       async tokenIdDiff => {
  //         await ems.connect(otherAddress).submitClaim(tokenIdDiff, 1, 30, {value: claimCost2}).then(tx => tx.wait());
  //         const diffIndices = tokenDiffToBytes(tokenId.toBigInt(), tokenIdDiff.toBigInt());
  //         const gas = await ems.estimateGas.challengeClaim(tokenIdDiff, tokenId, diffIndices);
  //         // const gas = await ems.estimateGas.challengeClaim(tokenIdDiff, tokenId);
  //         console.log(tokenIdDiff, gas);
  //         return gas;
  //       }
  //     )
  //   );
  //   console.log(
  //     'Average:',
  //     gasValues.reduce((total, value) => total.add(value), BigNumber.from(0)).div(gasValues.length)
  //   );
  // });
});
