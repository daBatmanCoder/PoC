// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ERC721MetaTx {

    mapping (uint256 => address) public _owners;
    uint public counter = 0; 

    // This is a simplified version, in reality you'd use EIP-2771 or a known pattern like ERC2771Context.

    function executeMetaTransaction(
        address userAddress,
        bytes memory functionSignature,
        bytes32 r,
        bytes32 s,
        uint8 v
    )
        public
        returns (bytes memory)
    {
        // Recover signer
        bytes32 hash = keccak256(abi.encodePacked(userAddress, functionSignature, block.chainid));
        address signer = ecrecover(toEthSignedMessageHash(hash), v, r, s);
        require(signer == userAddress, "Signer and userAddress do not match");

        // Execute the call
        (bool success, bytes memory returnData) = address(this).call(functionSignature);
        require(success, "Function call not successful");

        return returnData;
    }

    // Example of a function to mint NFT that can be called through meta-tx
    // The `functionSignature` would encode a call to `mintToken(to, tokenId)`
    function mintToken(address to, uint256 tokenId) internal {
        require(msg.sender == address(this), "Can only be called via executeMetaTransaction");
        // caller is the user who signed off-chain
        _owners[tokenId] = to;
        counter++;
    }

    function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
}
