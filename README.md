# Ethereum Mark System (EMS)

WIP

A personal project built over the last couple months, EMS is a combination of a Solidity ERC721 contract and React/Typescript/MobX frontend, which allows the registration of a unique 16*16, 2-color pixel art image (a 'mark'), in the same way that ENS allows the registration of a unique name. Hardhat and ethers.js were used for local development and testing, and wagmi.sh and RainbowKit were used for wallet connection and contract interaction.

Changing a single letter in an ENS name creates a clearly distinct name, but changing a single pixel in an image creates a new version that is easy to mistake for the original, and so to ensure the more general 'visual uniqueness' of an EMS mark, the registration process includes the option to specify an 'edit distance reservation' (measured in pixel color flips), creating a visual boundary within which no one else can claim a similar-looking mark. Verifying on-chain that a new claim does not infringe on any other claim's boundary would be cost-prohibitive, and so instead an optimistic submission/challenge process was implemented, meaning that only a proof of infringement needs to be verified on-chain in such a case.
