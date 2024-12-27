// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MetaMintingTX is EIP712 {

    mapping(address => uint256) private _nonces; // Nonces to prevent replay attacks
    mapping(uint256 => address) public _owners; // Tracks token ownership
    uint256 public counter = 0; // Optional if using EIP-721
    
    event TokenMinted(address indexed owner, uint256 indexed tokenId);

    constructor() EIP712("MetaMintingTX", "1") {}

    function getNonce(address owner) public view virtual returns (uint256) {
        return _nonces[owner];
    }

    function _useNonce(address owner, uint256 nonce) internal virtual returns (uint256) {
        uint256 currentNonce = _nonces[owner];
        require(currentNonce == nonce, "Invalid nonce");
        return _nonces[owner]++;
    }

    // Define a new typehash for the minting operation
    bytes32 constant MINT_TOKEN_TYPEHASH =
        keccak256("MintToken(address owner,uint256 tokenId,uint256 nonce)");

    function mintTokenMetaTX(
        address owner,
        uint256 tokenId,
        uint256 nonce,
        bytes calldata signature
    ) public {
        // Ensure the nonce is valid and incremented
        uint256 currentNonce = _useNonce(owner, nonce);

        // Recover the signer address
        (address recoveredAddress, ECDSA.RecoverError err) = ECDSA.tryRecover(
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        MINT_TOKEN_TYPEHASH,
                        owner,
                        tokenId,
                        currentNonce
                    )
                )
            ),
            signature
        );

        require(
            err == ECDSA.RecoverError.NoError && recoveredAddress == owner,
            "Signature verification failed"
        );

        // Mint the token
        _mintToken(owner, tokenId);
    }

    function _mintToken(address to, uint256 tokenId) internal {
        require(_owners[tokenId] == address(0), "Token already minted");
        _owners[tokenId] = to; // Assign ownership
        counter++; // Increment token counter
        emit TokenMinted(to, tokenId); // Emit mint event
    }
}