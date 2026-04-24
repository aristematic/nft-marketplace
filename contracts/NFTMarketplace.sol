// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is ReentrancyGuard, Ownable {

    // ─── State ───────────────────────────────────────────────────────────────

    uint256 public platformFeeBasisPoints; // e.g. 250 = 2.5%
    address public feeRecipient;

    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    // listingId => Listing
    mapping(uint256 => Listing) public listings;
    uint256 private _nextListingId;

    // ─── Events ──────────────────────────────────────────────────────────────

    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price
    );

    event Sale(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price,
        uint256 platformFee,
        uint256 royaltyAmount
    );

    event ListingCancelled(uint256 indexed listingId, address indexed seller);

    event PriceUpdated(uint256 indexed listingId, uint256 oldPrice, uint256 newPrice);

    // ─── Errors ──────────────────────────────────────────────────────────────

    error PriceMustBeAboveZero();
    error NotTokenOwner();
    error MarketplaceNotApproved();
    error ListingNotActive();
    error NotSeller();
    error InsufficientPayment(uint256 required, uint256 provided);
    error CannotBuyOwnListing();
    error TransferFailed();
    error ZeroAddress();

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(uint256 _platformFeeBasisPoints, address _feeRecipient) Ownable(msg.sender) {
        if (_feeRecipient == address(0)) revert ZeroAddress();
        platformFeeBasisPoints = _platformFeeBasisPoints;
        feeRecipient = _feeRecipient;
    }

    // ─── List ────────────────────────────────────────────────────────────────

    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external returns (uint256 listingId) {
        if (price == 0) revert PriceMustBeAboveZero();

        IERC721 nft = IERC721(nftContract);

        if (nft.ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (!nft.isApprovedForAll(msg.sender, address(this)) &&
            nft.getApproved(tokenId) != address(this)) revert MarketplaceNotApproved();

        listingId = _nextListingId++;

        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });

        emit Listed(listingId, msg.sender, nftContract, tokenId, price);
    }

    // ─── Buy ─────────────────────────────────────────────────────────────────

    function buyNFT(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];

        if (!listing.active) revert ListingNotActive();
        if (msg.sender == listing.seller) revert CannotBuyOwnListing();
        if (msg.value < listing.price) revert InsufficientPayment(listing.price, msg.value);

        // Mark inactive before transfers (CEI pattern)
        listing.active = false;

        uint256 salePrice = listing.price;
        address seller = listing.seller;
        address nftContract = listing.nftContract;
        uint256 tokenId = listing.tokenId;

        // ── Fee splits ──────────────────────────────────────────────────────

        // 1. Platform fee
        uint256 platformFee = (salePrice * platformFeeBasisPoints) / 10000;

        // 2. Royalty (ERC-2981)
        uint256 royaltyAmount = 0;
        address royaltyReceiver = address(0);

        try IERC2981(nftContract).royaltyInfo(tokenId, salePrice) returns (
            address receiver,
            uint256 amount
        ) {
            if (receiver != address(0) && amount > 0) {
                royaltyReceiver = receiver;
                royaltyAmount = amount;
            }
        } catch {}

        // 3. Seller gets the rest
        uint256 sellerProceeds = salePrice - platformFee - royaltyAmount;

        // ── Transfers ───────────────────────────────────────────────────────

        // Transfer NFT to buyer
        IERC721(nftContract).safeTransferFrom(seller, msg.sender, tokenId);

        // Pay platform
        if (platformFee > 0) {
            _sendETH(feeRecipient, platformFee);
        }

        // Pay royalty
        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            _sendETH(royaltyReceiver, royaltyAmount);
        }

        // Pay seller
        _sendETH(seller, sellerProceeds);

        // Refund overpayment
        if (msg.value > salePrice) {
            _sendETH(msg.sender, msg.value - salePrice);
        }

        emit Sale(listingId, msg.sender, seller, salePrice, platformFee, royaltyAmount);
    }

    // ─── Cancel ──────────────────────────────────────────────────────────────

    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];

        if (!listing.active) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotSeller();

        listing.active = false;

        emit ListingCancelled(listingId, msg.sender);
    }

    // ─── Update Price ────────────────────────────────────────────────────────

    function updatePrice(uint256 listingId, uint256 newPrice) external {
        if (newPrice == 0) revert PriceMustBeAboveZero();

        Listing storage listing = listings[listingId];

        if (!listing.active) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotSeller();

        uint256 oldPrice = listing.price;
        listing.price = newPrice;

        emit PriceUpdated(listingId, oldPrice, newPrice);
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    function updatePlatformFee(uint256 newFeeBasisPoints) external onlyOwner {
        platformFeeBasisPoints = newFeeBasisPoints;
    }

    function updateFeeRecipient(address newRecipient) external onlyOwner {
        if (newRecipient == address(0)) revert ZeroAddress();
        feeRecipient = newRecipient;
    }

    // ─── View ────────────────────────────────────────────────────────────────

    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    function totalListings() external view returns (uint256) {
        return _nextListingId;
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    function _sendETH(address to, uint256 amount) internal {
        (bool success, ) = payable(to).call{value: amount}("");
        if (!success) revert TransferFailed();
    }
}