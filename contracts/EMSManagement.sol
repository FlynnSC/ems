// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./EMS.sol";
import "hardhat/console.sol";

// TODO eventually add obfuscation layer to the initial claim submission with commit reveal?
// TODO add the ability to increase/decrease the editBuffer for an owned token, and in 
// doing so add to the deposit/get a partial refund (to the closest year)?
// TODO use custom errors rather than revert strings
// TODO properly think about fee calculation
// TODO Ability to set primary EMS for an address
contract EMSManagement is EMS {
    enum ClaimStatus {
        INACTIVE,
        PENDING,
        ACTIVE
    }

    struct Claim {
        address owner;
        uint40 startDate; // Unix timestamp (seconds)
        uint16 duration; // In years
        uint8 editBuffer;
        uint24 index; // Used to determine the order of two claims, even if made inside the same block
        ClaimStatus status;
    }
    
    // The duration after the claim has been created in which the claim is still pending but can be 
    // challenged
    uint256 public constant claimChallengePeriod = 1 minutes;

    // The unit of time which the duration of a claim is measured in (discrete years)
    uint256 public constant claimTimeUnit = 365 days;

    uint256 public constant durationCostFactor = 0.001 ether;
    uint256 public constant editBufferCostFactor = 1 gwei;

    // Incremented upon each claim submission (first two go to contract)
    uint256 public currClaimIndex = 2;

    // Mapping from tokenId to related Claim
    mapping(uint256 => Claim) public claims;

    event ClaimSubmitted(uint256 indexed tokenId, address indexed owner); 
    event ClaimChallenged(uint256 indexed tokenId, address challenger);
    event ClaimAccepted(uint256 indexed tokenId); // TODO Replace/integrate with Transfer event?
    event ClaimRetracted(uint256 indexed tokenId);

    // TODO maybe restructure storage of claims and tokenConfigs???
    constructor() EMS() {
        Claim storage blankClaim = claims[0];
        blankClaim.owner = address(this);
        blankClaim.startDate = uint40(block.timestamp);
        blankClaim.duration = type(uint16).max;
        blankClaim.index = 0;
        blankClaim.status = ClaimStatus.ACTIVE;
        emit ClaimSubmitted(0, address(this));
        emit ClaimAccepted(0);
        tokenConfigs[0].foregroundColor = Color.wrap(0x000000);
        tokenConfigs[0].backgroundColor = Color.wrap(0xffffff);

        blankClaim = claims[type(uint256).max];
        blankClaim.owner = address(this);
        blankClaim.startDate = uint40(block.timestamp);
        blankClaim.duration = type(uint16).max;
        blankClaim.index = 1;
        blankClaim.status = ClaimStatus.ACTIVE;
        emit ClaimSubmitted(type(uint256).max, address(this));
        emit ClaimAccepted(type(uint256).max);
        tokenConfigs[type(uint256).max].foregroundColor = Color.wrap(0x000000);
        tokenConfigs[type(uint256).max].backgroundColor = Color.wrap(0xffffff);
    }

    // Users should not make claims that infringe upon their other claims, because people can still 
    // challenge them
    function submitClaim(
        uint256 tokenId,
        uint16 duration,
        uint8 editBuffer,
        Color foregroundColor,
        Color backgroundColor
    ) external payable {
        Claim storage newClaim = claims[tokenId];

        require(newClaim.status == ClaimStatus.INACTIVE, "Claim on this token already exists");
        require(msg.value >= getClaimCost(duration, editBuffer), "Insufficient payment for claim");

        newClaim.owner = msg.sender;
        newClaim.startDate = uint40(block.timestamp);
        newClaim.duration = duration;
        newClaim.editBuffer = editBuffer;
        newClaim.index = uint24(currClaimIndex);
        newClaim.status = ClaimStatus.PENDING;
        tokenConfigs[tokenId].foregroundColor = foregroundColor;
        tokenConfigs[tokenId].backgroundColor = backgroundColor;

        unchecked { ++currClaimIndex; }

        emit ClaimSubmitted(tokenId, msg.sender);
    }

    // Can be used to delete a claim and retrieve the deposit in the situation in which someone 
    // accidentally creates a pending claim A that infringes upon a pending claim B that already exists,
    // the owner of which would be able to challenge claim A as soon as it passes the pending period and
    // becomes active after they call acceptClaim. Can also be used to retract a claim that has already
    // passed the challenge period (and is most likely active) if the owner wants to renounce ownership,
    // but will not refund them any amount in this case. Finally, can be used by someone to retract an 
    // expired claim that is not theirs, who will similarly receive no refund.
    function retractClaim(uint256 tokenId) external {
        Claim storage claim = claims[tokenId];
        require(claim.status != ClaimStatus.INACTIVE, "Cannot retract inactive claim");
        require(
            msg.sender == claim.owner || block.timestamp > claim.startDate + claim.duration * claimTimeUnit, 
            "Not the owner of this claim"
        );

        // Refund the owner if still within the challenge period
        if (block.timestamp <= claim.startDate + claimChallengePeriod) {
            uint256 refundAmount = getClaimCost(claim.duration, claim.editBuffer);
            delete claims[tokenId];
            delete tokenConfigs[tokenId];
            payable(msg.sender).transfer(refundAmount);
        } else {
            delete claims[tokenId];
            delete tokenConfigs[tokenId];
        }
        
        emit ClaimRetracted(tokenId);
    }

    function challengeClaim(
        uint256 tokenIdToChallenge, 
        uint256 tokenIdInfringedUpon,
        bytes calldata diffIndices
    ) external {
        Claim storage challendedClaim = claims[tokenIdToChallenge];
        Claim storage infringedUponClaim = claims[tokenIdInfringedUpon];
        require(
            infringedUponClaim.status == ClaimStatus.ACTIVE,
            "No active claim on the infringed token"
        );

        // Also handles the case in which tokenIdToChallenge and tokenIdInfringedUpon are the same
        require(
            challendedClaim.index > infringedUponClaim.index,
            "Claim upon the infringed token was not made before the claim upon the challenged token"
        );

        // Accounts for both a new claim being made inside another's editBuffer, and a new
        // claim being made that includes a prexisting claim in its editBuffer
        require(
            diffIndices.length <= max(infringedUponClaim.editBuffer, challendedClaim.editBuffer), 
            "Invalid challenge: too many diffIndices entries"
        );

        // Morphs the tokenIdToChallenge to the tokenIdInfringedUpon by flipping bits using the 
        // supplied diffIndices, if the morph is successful then the challenge is valid
        uint256 tokenIdMorph = tokenIdToChallenge;
        for (uint256 i; i < diffIndices.length;) {
            tokenIdMorph = tokenIdMorph ^ (1 << uint8(diffIndices[i]));
            unchecked { ++i; } // lol 
        }
        require(
            tokenIdMorph == tokenIdInfringedUpon, 
            "Invalid challenge: provided diffIndices does not prove infringement"
        );

        uint256 challengerReward = getClaimCost(challendedClaim.duration, challendedClaim.editBuffer);
        delete claims[tokenIdToChallenge];
        delete tokenConfigs[tokenIdToChallenge];

        payable(msg.sender).transfer(challengerReward);

        emit ClaimChallenged(tokenIdToChallenge, msg.sender);
    }

    function acceptClaim(uint256 tokenId) external {
        Claim storage claim = claims[tokenId];
        require(claim.status == ClaimStatus.PENDING, "No pending claim on the supplied tokenId");
        require(
            block.timestamp > claim.startDate + claimChallengePeriod, 
            "Claim still within the challenge period"
        );
        claim.status = ClaimStatus.ACTIVE;

        emit ClaimAccepted(tokenId);
    }

    function extendClaimDuration(uint256 tokenId, uint16 extension) external payable {
        require(claims[tokenId].status != ClaimStatus.INACTIVE, "No active claim on supplied token");
        claims[tokenId].duration += extension;
    }

    function getClaimCost(uint256 duration , uint8 editBuffer) public pure returns (uint256) {
        return duration * (durationCostFactor + editBufferCostFactor * (2 << editBuffer));  
    }

    function getDiffIndices(uint256 tokenId1, uint256 tokenId2) external pure returns (bytes memory) {
        uint256 diff = tokenId1 ^ tokenId2;
        bytes memory diffIndices = "";
        for (uint256 i = 0; i < 256; ++i) {
            if ((diff >> i) & 0x1 == 1) {
                diffIndices = bytes.concat(diffIndices, bytes1(uint8(i)));
            }
        }
        return diffIndices;
    }

    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a >= b ? a : b;
    }

    // -------------------------------------------------------------------------------------------
    // Below is the logic used in the old challengeClaim implementation, kept because it was a fun
    // optimisation challenge :)

    // A lookup table mapping each consecutive uint6 value to the number of 1s that the binary
    // representation of the value contains. A uint6 can have up to 6 1s in it, and so the 1s count
    // can be represented with a uint3. There are 64 possible uint6 values, and so this lookupTable is
    // is 64 uint3s packed consecutively into a uint256, such that the Nth uint3 (little-endian) 
    // represents the number of 1s in the binary representation of N (as a uint6).
    uint256 private constant lookupTable = 0xd6cb23b238dab238da8da691b238da8da6918da691691448;

    // Gets the naive edit distance between two tokens
    function getEditDistance(uint256 tokenId1, uint256 tokenId2) private pure returns (uint256) {
        uint256 diff = tokenId1 ^ tokenId2;
        uint256 editDistance = 0;

        // Iterates through the diff, 6 bits at a time, counting the 1s
        while (diff != 0) {
            // 'diff & 0x3f' gets the lowest 6 bits of diff, which as a uint6 represents the index
            // within the lookupTable to look in. '... * 3' converts the index into the number of bits to 
            // shift (at each index is a uint3), 'lookupTable >> ...' does the shift and then '... & 0x7'
            // gets the correct 3 bits, which as a uint3 represent the number of 1s in 'diff & 0x3f'.
            unchecked { editDistance += (lookupTable >> ((diff & 0x3f) * 3)) & 0x7; }
            diff >>= 6;
        }

        return editDistance;
    }
}
