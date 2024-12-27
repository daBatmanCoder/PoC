// Need to import web3j org library~!

import org.web3j.crypto.*;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Uint;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.utils.Numeric;
import org.web3j.utils.Bytes;
import org.web3j.protocol.core.methods.request.Transaction;
import org.web3j.protocol.core.methods.response.EthGasPrice;

import java.math.BigInteger;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.io.*;
import java.util.Arrays;
import java.util.Collections;

public class clientCode {
    public static void main( String[] args ) {

           
        String contractAddress = "<CONTRACT_ADDRESS>";

        String userAddress = "<USER_PUBBLIC_ADDRESS>";
        
        BigInteger tokenId = BigInteger.valueOf("<TOKEN_ID>");

        BigInteger nonce = getNonceFromContract(contractAddress, userAddress);

        String signedTransactionData = signMetaTransaction(
                contractAddress,
                userAddress,
                tokenId,
                nonce,
                "<CHAIN_ID>",
                "<USER_EC_KEY>"
        );
        
    }


    private static BigInteger getNonceFromContract(String contractAddress, String userAddress) {
        try {
            Function nonceFunction = new Function(
                "getNonce",
                Arrays.asList(new Address(userAddress)),
                Arrays.asList(new TypeReference<Uint256>() {})
            );

            String encodedFunction = FunctionEncoder.encode(nonceFunction);

            EthCall response = web3s.ethCall(
                Transaction.createEthCallTransaction(userAddress, contractAddress, encodedFunction),
                DefaultBlockParameterName.LATEST
            ).send();

            return new BigInteger(response.getValue().substring(2), 16);
        } catch (Exception e) {
            throw new RuntimeException("Error fetching nonce from contract", e);
        }
        
    }
    
    private static byte[] createMintTokenMessageHash(
            String contractAddress,
            String ownerAddress,
            BigInteger tokenId,
            BigInteger nonce,
            long chainId
    ) {
        // Build domain separator
        byte[] domainSeparator = buildDomainSeparator("MetaMintingTX", "1", chainId, contractAddress);
        
        // Create struct hash
        byte[] structHash = createStructHash(ownerAddress, tokenId, nonce);
        
        // Combine using standard EIP-712 format
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try {
            outputStream.write(new byte[]{0x19, 0x01});
            outputStream.write(domainSeparator);
            outputStream.write(structHash);
        } catch (IOException e) {
            throw new RuntimeException("Error concatenating message components", e);
        }
        
        return Hash.sha3(outputStream.toByteArray());
    }

    private static byte[] createStructHash(String ownerAddress, BigInteger tokenId, BigInteger nonce) {
        // Calculate struct type hash
        String typeString = "MintToken(address owner,uint256 tokenId,uint256 nonce)";
        byte[] typeHash = Hash.sha3(typeString.getBytes(StandardCharsets.UTF_8));

        // Encode parameters
        byte[] encodedOwner = Numeric.hexStringToByteArray(Numeric.cleanHexPrefix(ownerAddress));
        byte[] encodedTokenId = Numeric.toBytesPadded(tokenId, 32);
        byte[] encodedNonce = Numeric.toBytesPadded(nonce, 32);

        // Concatenate and hash
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        try {
            buffer.write(typeHash);
            buffer.write(new byte[12]); // pad address to 32 bytes
            buffer.write(encodedOwner);
            buffer.write(encodedTokenId);
            buffer.write(encodedNonce);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        return Hash.sha3(buffer.toByteArray());
    }

    private static byte[] buildDomainSeparator(String name, String version, long chainId, String contractAddress) {
        String DOMAIN_TYPE_HASH = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
        byte[] typeHash = Hash.sha3(DOMAIN_TYPE_HASH.getBytes(StandardCharsets.UTF_8));

        byte[] nameHash = Hash.sha3(name.getBytes(StandardCharsets.UTF_8));
        byte[] versionHash = Hash.sha3(version.getBytes(StandardCharsets.UTF_8));
        byte[] encodedChainId = Numeric.toBytesPadded(BigInteger.valueOf(chainId), 32);
        byte[] encodedAddress = Numeric.hexStringToByteArray(Numeric.cleanHexPrefix(contractAddress));

        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        try {
            buffer.write(typeHash);
            buffer.write(nameHash);
            buffer.write(versionHash);
            buffer.write(encodedChainId);
            buffer.write(new byte[12]); // pad address to 32 bytes
            buffer.write(encodedAddress);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        return Hash.sha3(buffer.toByteArray());
    }

    public static String signMetaTransaction(
            String contractAddress,
            String ownerAddress,
            BigInteger tokenId,
            BigInteger nonce,
            long chainId,
            ECKeyPair keyPair
    ) {
        byte[] messageHash = createMintTokenMessageHash(
                contractAddress,
                ownerAddress,
                tokenId,
                nonce,
                chainId
        );

        Sign.SignatureData signature = Sign.signMessage(messageHash, keyPair, false);

        byte[] r = signature.getR();
        byte[] s = signature.getS();
        byte v = signature.getV()[0];

        // Concatenate r + s + v using ByteArrayOutputStream instead of System.arraycopy
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try {
            outputStream.write(r);
            outputStream.write(s);
            outputStream.write(new byte[]{v});
        } catch (IOException e) {
            throw new RuntimeException("Error concatenating signature components", e);
        }

        return Numeric.toHexString(outputStream.toByteArray());
    }

    private static byte[] concatenate(byte[]... arrays) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        for (byte[] array : arrays) {
            outputStream.write(array);
        }
        return outputStream.toByteArray();
    }

}
  