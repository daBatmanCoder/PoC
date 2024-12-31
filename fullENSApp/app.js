let web3;
let accounts;

const wweb3 = new Web3();

// Connect to MetaMask
const connectButton = document.getElementById('connect-button');
const connectStatus = document.getElementById('connect-status');
let session_id;
let user_address;


document.addEventListener('DOMContentLoaded', function() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  const userAddress = params.get('user_address');

  if (sessionId) {
    session_id = sessionId;
  } 

  if (userAddress && wweb3.utils.isAddress(userAddress)) {
    console.log("heysdsd");
    user_address = userAddress;
  }

});

connectButton.addEventListener('click', async () => {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      web3 = new Web3(window.ethereum);
      accounts = await web3.eth.getAccounts();
      connectStatus.classList.remove('disconnected');
      connectStatus.classList.add('connected');
      searchButton.disabled = false;
    } catch (error) {
      console.error('User denied account access');
    }
  } else {
    console.error('MetaMask is not installed');
  }
});

// Search for ENS domain
const ensInput = document.getElementById('ens-input');
const searchButton = document.getElementById('search-button');
const resultDiv = document.getElementById('result');
const verifyButton = document.getElementById('verify-button');
const verifyResultDiv = document.getElementById('verify-result');
const changeNetworkButton = document.getElementById('change-network');

searchButton.addEventListener('click', async () => {
  const ensDomain = ensInput.value;
  if (web3 && ensDomain) {
    try {
      // Check if the current network is Ethereum
      const networkId = await web3.eth.net.getId();
      if (networkId !== 1) {
        // Prompt the user to switch to the Ethereum network
        const shouldSwitch = window.confirm('You are not connected to the Ethereum network. Do you want to switch?');
        if (shouldSwitch) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x1' }],
            });
          } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
              const shouldAdd = window.confirm('The Ethereum network is not available in your MetaMask. Do you want to add it?');
              if (shouldAdd) {
                try {
                  await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                      {
                        chainId: '0x1',
                        rpcUrls: ['https://mainnet.infura.io/v3/'],
                      },
                    ],
                  });
                } catch (addError) {
                  console.error('Failed to add Ethereum network:', addError);
                }
              }
            } else {
              console.error('Failed to switch to Ethereum network:', switchError);
            }
          }
        }
      }

      // Resolve the ENS domain
      const address = await web3.eth.ens.getAddress(ensDomain);
      resultDiv.textContent = `The address for ${ensDomain} is ${address}`;
      verifyButton.disabled = false;
    } catch (error) {
      const resolverAddressRegex = /The resolver at (0x[0-9a-fA-F]{40})does not implement requested method/;
      const match = error.message.match(resolverAddressRegex);
      if (match && match[1] !== '0x0000000000000000000000000000000000000000') {
        resultDiv.textContent = `The address for ${ensDomain} is ${match[1]}`;
        verifyButton.disabled = false;
      } else {
        resultDiv.textContent = `Error: ${error.message}`;
        verifyButton.disabled = true;
      }
    }
  } else {
    resultDiv.textContent = 'Please connect to MetaMask and enter an ENS domain';
    verifyButton.disabled = true;
  }


});

let generatedUUID;  // Will store the UUID


// Generate a UUID (using the browser's crypto API if available).
function generateUUID() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID(); 
  } else {
    // Fallback if crypto.randomUUID() is not supported:
    // This is a simplified fallback; for production, consider a robust UUID library.
    return 'xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// changeNetworkButton.addEventListener('click', async () => {
//   // Switch to the Amoy testnet in MetaMask
//       // (You must know the correct chainId for Amoy. For example '0x2329' could be just an example.)
//       const amoyChainId = '0x13882'; // <-- Put the CORRECT chain ID in hex format here

//       // This will either switch or throw an error
//       await window.ethereum.request({
//         method: 'wallet_switchEthereumChain',
//         params: [{ chainId: amoyChainId }],
//       });

      


// });


verifyButton.addEventListener('click', async () => {

  generatedUUID = generateUUID();
    console.log(generatedUUID);

    try {

      const amoyChainId = '0x13882';

      // try {
      //   await window.ethereum.request({
      //     method: 'wallet_switchEthereumChain',
      //     params: [{ chainId: amoyChainId }],
      //   });
      // } catch (switchError) {
      //   if (switchError.code === 4902) {
      //     await window.ethereum.request({
      //       method: 'wallet_addEthereumChain',
      //       params: [{
      //         chainId: amoyChainId,
      //         chainName: 'Polygon Amoy',
      //         nativeCurrency: {
      //           name: 'MATIC',
      //           symbol: 'MATIC',
      //           decimals: 18
      //         },
      //         rpcUrls: ['https://polygon-amoy.drpc.org'],
      //         blockExplorerUrls: ['https://www.oklink.com/amoy']
      //       }]
      //     });
      //   } else {
      //     throw switchError;
      //   }
      // }
  
      // Re-initialize web3 with MetaMask provider
      web3 = new Web3(window.ethereum);
      
      // Request accounts again after network switch
      accounts = await web3.eth.getAccounts();
      
      if (!accounts || accounts.length === 0) {
        console.log('No accounts found. Please check MetaMask connection.');
        throw new Error('No accounts found. Please check MetaMask connection.');
      }
    
    // 1) Prepare contract details
    const contractAddress = '0x55943e3652438710bfCdd01E0eaBb3335fCEA162';
    const contractABI = [
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "_ENSNode",
            "type": "bytes32"
          },
          {
            "internalType": "string",
            "name": "_uuid",
            "type": "string"
          }
        ],
        "name": "ProveENS",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_valueForTransaction",
            "type": "uint256"
          },
          {
            "internalType": "contract IENS",
            "name": "ensContract",
            "type": "address"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      }
    ]; // <-- Replace with actual ABI
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    function namehash(name) {
      let node = '0x0000000000000000000000000000000000000000000000000000000000000000';
      if (name) {
        const labels = name.toLowerCase().split('.');
        for (let i = labels.length - 1; i >= 0; i--) {
          const labelHash = web3.utils.keccak256(web3.utils.utf8ToHex(labels[i]));
          node = web3.utils.keccak256(node + labelHash.slice(2));
        }
      }
      return node;
    }

    const ENSNode = namehash(ensInput.value);
    console.log('ENS Node:', ENSNode);

    const gasEstimate = await contract.methods
      .ProveENS(ENSNode, generatedUUID)
      .estimateGas({ from: accounts[0] });

    // Add 20% buffer to gas estimate
    const gasLimit = Math.round(gasEstimate * 1.2);
    
    const tx = await contract.methods
      .ProveENS(ENSNode, generatedUUID)
      .send({ 
        from: accounts[0],
        value: 1,
        gas: gasLimit
      });

    // 3) Wait for transaction to be mined and display its hash
    verifyResultDiv.textContent = `Transaction hash: ${tx.transactionHash}`;
  } catch (error) {
    console.error('Error:', error);
    verifyResultDiv.textContent = `Error: ${error.message}`;
  }
});