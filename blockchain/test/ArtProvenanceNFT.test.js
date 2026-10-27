const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArtProvenanceNFT Contract Tests", function () {
  let contract;
  let owner;
  let artist;
  let buyer;

  const validModelHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const sampleAssetId = "asset_test_1001";
  const sampleCertId = "cert_test_2002";
  const sampleTokenURI = "http://127.0.0.1:8000/api/blockchain/nft-metadata/asset_test_1001";

  beforeEach(async function () {
    [owner, artist, buyer] = await ethers.getSigners();
    const ArtProvenanceNFT = await ethers.getContractFactory("ArtProvenanceNFT");
    contract = await ArtProvenanceNFT.deploy();
    await contract.waitForDeployment();
  });

  it("should deploy with proper name and symbol", async function () {
    expect(await contract.name()).to.equal("Art3D Provenance NFT");
    expect(await contract.symbol()).to.equal("A3DP");
    expect(await contract.totalMinted()).to.equal(0);
  });

  it("Test 8 - Successful local NFT mint and event emission", async function () {
    const tx = await contract.mintAssetNFT(
      artist.address,
      sampleTokenURI,
      sampleAssetId,
      validModelHash,
      sampleCertId
    );
    const receipt = await tx.wait();

    // Verify token ownership
    const tokenId = 1;
    expect(await contract.ownerOf(tokenId)).to.equal(artist.address);
    expect(await contract.totalMinted()).to.equal(1);
    expect(await contract.tokenURI(tokenId)).to.equal(sampleTokenURI);

    // Verify on-chain provenance record
    const record = await contract.getProvenanceRecord(tokenId);
    expect(record.assetId).to.equal(sampleAssetId);
    expect(record.modelHash).to.equal(validModelHash);
    expect(record.certificateId).to.equal(sampleCertId);
    expect(record.mintTimestamp).to.be.gt(0);

    // Verify model hash lookup
    expect(await contract.getTokenIdByModelHash(validModelHash)).to.equal(tokenId);

    // Verify event
    await expect(tx)
      .to.emit(contract, "AssetNFTMinted")
      .withArgs(tokenId, artist.address, sampleAssetId, validModelHash, sampleCertId);
  });

  it("Test 9 - Unauthorized or invalid mint request rejections", async function () {
    // 1. Zero address recipient
    await expect(
      contract.mintAssetNFT(
        ethers.ZeroAddress,
        sampleTokenURI,
        sampleAssetId,
        validModelHash,
        sampleCertId
      )
    ).to.be.revertedWith("Invalid recipient address: zero address");

    // 2. Empty token URI
    await expect(
      contract.mintAssetNFT(
        artist.address,
        "",
        sampleAssetId,
        validModelHash,
        sampleCertId
      )
    ).to.be.revertedWith("Token URI cannot be empty");

    // 3. Invalid model hash length (must be 64-char SHA-256)
    await expect(
      contract.mintAssetNFT(
        artist.address,
        sampleTokenURI,
        sampleAssetId,
        "short_invalid_hash",
        sampleCertId
      )
    ).to.be.revertedWith("Model hash must be a 64-character SHA-256 hex string");

    // 4. Empty asset ID
    await expect(
      contract.mintAssetNFT(
        artist.address,
        sampleTokenURI,
        "",
        validModelHash,
        sampleCertId
      )
    ).to.be.revertedWith("Asset ID cannot be empty");

    // 5. Empty certificate ID
    await expect(
      contract.mintAssetNFT(
        artist.address,
        sampleTokenURI,
        sampleAssetId,
        validModelHash,
        ""
      )
    ).to.be.revertedWith("Certificate ID cannot be empty");
  });

  it("should allow transferring minted NFT between accounts", async function () {
    await contract.mintAssetNFT(
      artist.address,
      sampleTokenURI,
      sampleAssetId,
      validModelHash,
      sampleCertId
    );

    // Artist transfers to buyer
    await contract.connect(artist).transferFrom(artist.address, buyer.address, 1);
    expect(await contract.ownerOf(1)).to.equal(buyer.address);
  });
});
