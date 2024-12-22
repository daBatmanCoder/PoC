# PoC (Proof of Concept) Collection

Welcome to my **PoC folder**—a place where I gather quick prototypes and experiments to explore different technical ideas. Each subfolder or project in here stands on its own, demonstrating a concept or technique that might be further developed in the future.

---

## Project 1: MetaTx

**MetaTx** demonstrates the idea of *meta-transactions* in a blockchain context. In a meta-transaction setup:
- A user signs an action off-chain (no gas fees at this stage).
- Another entity (often called a relayer) pays the gas and submits the transaction on-chain on the user’s behalf.
  
Included files:
- **`ERC721MetaTx.sol`**: A simplified Solidity smart contract with a function that can be called via a meta-transaction.
- **`clientCode.java`**: Java code showing how to encode and sign the function call data off-chain.

This is purely a proof of concept—actual production systems would need security reviews and a robust relayer infrastructure. 

Feel free to explore, experiment, and adapt these examples to your needs!