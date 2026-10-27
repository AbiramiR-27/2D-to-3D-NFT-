// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ArtProvenanceNFT
 * @notice Proof-of-Concept ERC-721 NFT contract for 2D-to-3D Digital Artworks with Cryptographic Provenance.
 * Stores verifiable provenance records: assetId, model SHA-256 hash, and signed certificate ID.
 */
contract ArtProvenanceNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    struct ProvenanceRecord {
        string assetId;
        string modelHash;
        string certificateId;
        uint256 mintTimestamp;
    }

    // Mapping from tokenId to on-chain provenance record
    mapping(uint256 => ProvenanceRecord) private _provenanceRecords;

    // Mapping to track model hash to minted tokenId
    mapping(string => uint256) private _modelHashToTokenId;

    event AssetNFTMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string assetId,
        string modelHash,
        string certificateId
    );

    constructor() ERC721("Art3D Provenance NFT", "A3DP") Ownable(msg.sender) {
        _nextTokenId = 1; // 1-indexed token IDs
    }

    /**
     * @notice Mint a new NFT representing the 3D asset with cryptographic certificate linkage.
     * @param recipient The destination wallet address.
     * @param uri The metadata URI (JSON metadata endpoint).
     * @param assetId The unique identifier of the source 3D asset.
     * @param modelHash The SHA-256 checksum of the 3D model file bytes.
     * @param certificateId The unique identifier of the signed provenance certificate.
     */
    function mintAssetNFT(
        address recipient,
        string calldata uri,
        string calldata assetId,
        string calldata modelHash,
        string calldata certificateId
    ) external returns (uint256) {
        require(recipient != address(0), "Invalid recipient address: zero address");
        require(bytes(uri).length > 0, "Token URI cannot be empty");
        require(bytes(assetId).length > 0, "Asset ID cannot be empty");
        require(bytes(modelHash).length == 64, "Model hash must be a 64-character SHA-256 hex string");
        require(bytes(certificateId).length > 0, "Certificate ID cannot be empty");

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, uri);

        _provenanceRecords[tokenId] = ProvenanceRecord({
            assetId: assetId,
            modelHash: modelHash,
            certificateId: certificateId,
            mintTimestamp: block.timestamp
        });

        _modelHashToTokenId[modelHash] = tokenId;

        emit AssetNFTMinted(tokenId, recipient, assetId, modelHash, certificateId);

        return tokenId;
    }

    /**
     * @notice Retrieve on-chain provenance metadata for a token.
     */
    function getProvenanceRecord(uint256 tokenId)
        external
        view
        returns (
            string memory assetId,
            string memory modelHash,
            string memory certificateId,
            uint256 mintTimestamp
        )
    {
        _requireOwned(tokenId);
        ProvenanceRecord storage record = _provenanceRecords[tokenId];
        return (record.assetId, record.modelHash, record.certificateId, record.mintTimestamp);
    }

    /**
     * @notice Check if a model hash has already been minted to an NFT.
     */
    function getTokenIdByModelHash(string calldata modelHash) external view returns (uint256) {
        return _modelHashToTokenId[modelHash];
    }

    /**
     * @notice Return the total number of minted tokens so far.
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
