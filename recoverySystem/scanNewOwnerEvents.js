// scanNewOwnerEvents.js
const { ethers } = require("ethers");


const RPC_PROVIDER = "https://polygon-rpc.com"; 

const CONTRACT_ADDRESS = "0x11AFa50841259a1Bf97C950B98900De51230878d";

const CREATION_TX_HASH = "0xa9336cf93b2ca8c81cc4a383572c39c531b6b8b39b2e303f49e006736e91ebcc";

const TARGET_ADDRESS = "0xc38C9Adf157429386B2eb452Ba7332cCd4c8F122";

const contractABI = [
  "event NewOwner(bytes32 indexed node, bytes32 indexed label, address owner)"
];

async function main() {
  try {
    // 1. Initialize provider
    const provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDER);
    console.log("hey");

    // 2. Get the block number where the contract was created.
    //    We do this by fetching the transaction receipt for the creation Tx.
    const creationReceipt = await provider.getTransactionReceipt(CREATION_TX_HASH);
    if (!creationReceipt || !creationReceipt.blockNumber) {
      console.error("Could not retrieve creation receipt or block number. Check CREATION_TX_HASH.");
      process.exit(1);
    }
    console.log("hey");
    const startBlock = creationReceipt.blockNumber;
    console.log(`Contract created at block ${startBlock}`);

    // 3. Create a contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

    // 4. We'll scan from the creation block to latest
    const endBlock = await provider.getBlockNumber();
    console.log(`Scanning NewOwner events from block ${startBlock} to block ${endBlock}...`);

    // 5. Query all NewOwner events in that range
    const events = await contract.queryFilter(
      contract.filters.NewOwner(null, null, null),
      startBlock,
      endBlock
    );
    console.log(`Total NewOwner events found: ${events.length}`);

    // 6. Filter by the target owner address
    const matchingEvents = events.filter((evt) => {
      // Compare addresses in lowercase
      return evt.args.owner.toLowerCase() === TARGET_ADDRESS.toLowerCase();
    });

    // 7. Display matching events
    console.log(`\nMatching events for owner ${TARGET_ADDRESS}: ${matchingEvents.length}`);
    matchingEvents.forEach((evt, idx) => {
      const { node, label, owner } = evt.args;
      console.log(`\n#${idx + 1}  Block: ${evt.blockNumber}, TxHash: ${evt.transactionHash}`);
      console.log(`    node  (bytes32) : ${node}`);
      console.log(`    label (bytes32) : ${label}`);
      console.log(`    owner (address) : ${owner}`);
    });

  } catch (error) {
    console.error("Error scanning contract events:", error);
  }
}

// Execute main
main();
