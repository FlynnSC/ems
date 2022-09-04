// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

type Color is uint24;

// Inspired by Openzeppelin's Strings.sol
library ColorStrings {
    bytes16 private constant _HEX_SYMBOLS = "0123456789abcdef";

    /**
     * @dev Converts a `Color` to its hex color string representation (eg. #05fe78) 
     */
    function toColorString(Color value) internal pure returns (string memory) {
        bytes memory buffer = new bytes(7);
        uint256 curr = Color.unwrap(value);
        buffer[0] = "#";
        for (uint256 i = 6; i > 0; --i) {
            buffer[i] = _HEX_SYMBOLS[curr & 0xf];
            curr >>= 4;
        }
        return string(buffer);
    }
}
