//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract NFTContract is ERC1155 {
    uint256 public constant DATA1 = 1;
    uint256 public constant DATA2 = 2;

    uint256[] tokenId = [DATA1, DATA2];
    uint256 public tokenIds = 2;

    //   string _uri;

    constructor()
        ERC1155(
            "https://ipfs.io/ipfs/QmXEXUZzPD76PCUgjyFD8vegdgFzGW8jJM5VeHoVF4MGz6/{id}.json"
        )
    {}

    function mintBatchToken(
        address to,
        uint256[] memory initalBatchSupply,
        string memory newuri
    ) public {
        _setURI(newuri);

        _mintBatch(to, tokenId, initalBatchSupply, "");
    }

    function mintToken(
        address to,
        uint256 initalSupply,
        string memory newuri
    ) public {
        tokenIds++;
        _setURI(newuri);
        _mint(to, tokenIds, initalSupply, "");
    }
}
