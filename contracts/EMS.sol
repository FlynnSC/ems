// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./ColorStrings.sol";

contract EMS is ERC721, Ownable {
    using Strings for uint256;
    using ColorStrings for Color;

    struct TokenConfig {
        Color foregroundColor;
        Color backgroundColor;
    }

    // TODO Change name to claimConfigs? claimColors?
    mapping(uint256 => TokenConfig) public tokenConfigs;

    constructor() ERC721("EMS Mark", "MARK") {}

    function updateTokenConfig(uint256 tokenId, Color foregroundColor, Color backgroundColor) public {
        // TODO add proper check
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "Caller is not owner nor approved"
        );
        tokenConfigs[tokenId].foregroundColor = foregroundColor;
        tokenConfigs[tokenId].backgroundColor = backgroundColor;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        (Color foregroundColor, Color backgroundColor) = getColors(tokenId);
        return string.concat(
            "data:application/json;base64,",
            Base64.encode(abi.encodePacked(
                '{"name":"EMS Mark","description":"EMS Description","image":"',
                tokenImage(tokenId),
                '","attributes":[{"trait_type":"Foreground Color","value":"',
                foregroundColor.toColorString(),
                '"},{"trait_type":"Background Color","value":"',
                backgroundColor.toColorString(),
                '"}]}'
            ))
        );
    }

    function tokenImage(uint256 tokenId) public view returns (string memory) {
        return string.concat("data:image/svg+xml;base64,", Base64.encode(bytes(tokenSVG(tokenId))));
    }

    // TODO check storage vs memory gas usage
    function tokenSVG(uint256 tokenId) public view returns (string memory) {
        (Color foregroundColor, Color backgroundColor) = getColors(tokenId);

        string memory path = "";
        uint256 mask = 1;
        for (uint256 y = 0; y < 16; ++y) {
            for (uint256 x = 0; x < 16; ++x) {
                if (tokenId & mask != 0) {
                    path = string.concat(path, 'M', x.toString(), ' ', y.toString(), ' v1 ');
                }
                mask <<= 1;
            }
        }

        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.5 0 16 16" shape-rendering="crispEdges" data-token-id="',
            tokenId.toHexString(),
            '"><rect x="-0.5" height="16" width="16" fill="',
            backgroundColor.toColorString(),
            '"/><path stroke="',
            foregroundColor.toColorString(),
            '" d="',
            path,
            '"/></svg>'
        );
    }

    function getColors(uint256 tokenId) internal view returns (Color foregroundColor, Color backgroundColor) {
        TokenConfig storage config = tokenConfigs[tokenId];

        // Allows the mark to show up after claiming without needing to change the config, and also prevents
        // obtaining a blank mark by setting the colors to the same value
        bool useDefaultColors = Color.unwrap(config.foregroundColor) == Color.unwrap(config.backgroundColor);
        return (
        useDefaultColors ? Color.wrap(0x000000) : config.foregroundColor,
        useDefaultColors ? Color.wrap(0xffffff) : config.backgroundColor
        );
    }
}
