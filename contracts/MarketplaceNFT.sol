// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract MarketplaceNFT is ERC721, ERC721URIStorage, Ownable, IERC2981 {
    
    // ─── State ───────────────────────────────────────────────────────────────

    uint256 private _nextTokenId;

    struct RoyaltyInfo {
        address receiver;
        uint96 feeBasisPoints; // 100 = 1%, 1000 = 10%, max 10000
    }

    // tokenId => royalty info
    mapping(uint256 => RoyaltyInfo) private _royalties;

    // ─── Events ──────────────────────────────────────────────────────────────

    event NFTMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string tokenURI,
        uint96 royaltyBasisPoints
    );

    // ─── Errors ──────────────────────────────────────────────────────────────

    error InvalidRoyaltyBasisPoints(uint96 provided);
    error ZeroAddress();

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor() ERC721("MarketplaceNFT", "MNFT") Ownable(msg.sender) {}

    // ─── Mint ────────────────────────────────────────────────────────────────

    function mint(
        address to,
        string calldata uri,
        uint96 royaltyBasisPoints
    ) external returns (uint256) {
        if (to == address(0)) revert ZeroAddress();
        if (royaltyBasisPoints > 10000) revert InvalidRoyaltyBasisPoints(royaltyBasisPoints);

        uint256 tokenId = _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        _royalties[tokenId] = RoyaltyInfo({
            receiver: to,
            feeBasisPoints: royaltyBasisPoints
        });

        emit NFTMinted(tokenId, to, uri, royaltyBasisPoints);

        return tokenId;
    }

    // ─── ERC-2981 Royalty ────────────────────────────────────────────────────

    function royaltyInfo(
        uint256 tokenId,
        uint256 salePrice 
    ) external view override returns (address receiver, uint256 royaltyAmount) {
        RoyaltyInfo memory info = _royalties[tokenId];
        receiver = info.receiver;
        royaltyAmount = (salePrice * info.feeBasisPoints) / 10000;
    }

    // ─── View ────────────────────────────────────────────────────────────────

    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    function getRoyaltyInfo(uint256 tokenId) external view returns (address receiver, uint96 basisPoints) {
        RoyaltyInfo memory info = _royalties[tokenId];
        return (info.receiver, info.feeBasisPoints);
    }

    // ─── Overrides required by Solidity ──────────────────────────────────────

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}