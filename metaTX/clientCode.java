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
import java.io.*;
import java.util.Arrays;
import java.util.Collections;

public class clientCode {
    public static void main( String[] args ) {
        String toAddress = "0xef3f49EB9208a19c00D28EBA90fe77b6C0464F7b";

        long chainId = 137L;
        
        Credentials userCredentials = Credentials.create("<PRIVATE_KEY>");
        String userAddress = userCredentials.getAddress();
        
        // 2. The function we want to call: mintToken(address to, uint256 tokenId)
        //    We'll omit the third param 'caller' because your contract appends userAddress automatically.
        BigInteger tokenId = BigInteger.valueOf(1234543);
        
        Function mintFunction = new Function(
            "mintToken",
            Arrays.asList(
                new Address(toAddress), 
                new Uint256(tokenId)
            ),
            Collections.emptyList() // no return values
        );
        
        // Encode the function call data
        String functionSignature = FunctionEncoder.encode(mintFunction); 
        // e.g. "0xa9059cbb0000000000000..."
        
        // In Java, we must replicate the encoding logic exactly.
        // A simplistic approach (careful with real production encoding):
        byte[] userAddressBytes = Numeric.hexStringToByteArray(userAddress);
        byte[] funcSigBytes = Numeric.hexStringToByteArray(functionSignature);
        byte[] chainIdBytes = Numeric.toBytesPadded(BigInteger.valueOf(chainId), 32); // 32-byte padded
        
        // Combine them
        byte[] combined = concatenate(userAddressBytes, funcSigBytes, chainIdBytes);
        byte[] hash = Hash.sha3(combined);
        
        Sign.SignatureData signature = Sign.signPrefixedMessage(hash, userCredentials.getEcKeyPair());
        
        // Extract r, s, v in hex
        byte[] r = signature.getR();
        byte[] s = signature.getS();
        byte[] v = signature.getV(); // Already includes chainId if using EIP-155, but here it's off-chain
        
        
        String signedTransaction = Numeric.toHexString(v) + "\n"+ Numeric.toHexString(r)+ "\n" + Numeric.toHexString(s);
        System.out.println("Signed Transaction: " + signedTransaction);
        System.out.println(functionSignature);
        System.out.println(userAddress);

        JSONObject data = new JSONObject();
        data.put("userAddress", userAddress);
        data.put("functionSignature", functionSignature);
        data.put("rValue", Numeric.toHexString(r));
        data.put("sValue", Numeric.toHexString(s));
        data.put("vValue", Numeric.toHexString(v)); // will be  ---> 1b or 1c - 27 or 28
    }

    private static byte[] concatenate(byte[]... arrays) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        for (byte[] array : arrays) {
            outputStream.write(array);
        }
        return outputStream.toByteArray();
    }
}
  