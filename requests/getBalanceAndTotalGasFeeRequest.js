const fs = require("fs");
const path = require("path");
const {
  SubscriptionManager,
  ResponseListener,
  ReturnType,
  decodeResult,
  FulfillmentCode,
} = require("@chainlink/functions-toolkit");
const ethers = require("ethers");
const functionsConsumerAbi = require("../artifacts/contracts/ChainlinkFunctionConsumer.sol/ChainlinkFunctionConsumer.json");


const makeRequestSepolia = async (accountAddress) => {
  // hardcoded for Ethereum Sepolia
  const routerAddress = "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0"; // Functions router
  const linkTokenAddress = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // LINK Token
  const donId = "fun-ethereum-sepolia-1";
  const subscriptionId = 3; // REPLACE this with your subscription ID
  const consumerAddress = "0x8dFf78B7EE3128D00E90611FBeD20A71397064D9"; // REPLACE this with your Functions consumer address

  const explorerUrl = "https://sepolia.etherscan.io";

  // Initialize functions settings
  const source = fs
    .readFileSync(path.resolve(__dirname, "../sources/getBalanceAndTotalGasFee.js"))
    .toString();

  // const args = ["ETH", "USD"];
  const args = accountAddress;
  const gasLimit = 300000;

  // Initialize ethers signer and provider to interact with the contracts onchain
  const privateKey = process.env.PRIVATE_KEY; // fetch PRIVATE_KEY
  if (!privateKey)
    throw new Error(
      "private key not provided - check your environment variables"
    );

  const rpcUrl = process.env.ETHEREUM_SEPOLIA_RPC_URL; // fetch Sepolia RPC URL
  if (!rpcUrl)
    throw new Error(`rpcUrl not provided  - check your environment variables`);

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const wallet = new ethers.Wallet(privateKey);
  const signer = wallet.connect(provider); // create ethers signer for signing transactions


  //////// ESTIMATE REQUEST COSTS ////////
  console.log("\nEstimate request costs...");
  // Initialize and return SubscriptionManager
  const subscriptionManager = new SubscriptionManager({
    signer: signer,
    linkTokenAddress: linkTokenAddress,
    functionsRouterAddress: routerAddress,
  });
  await subscriptionManager.initialize();

  // estimate costs in Juels

  const gasPriceWei = await signer.getGasPrice(); // get gasPrice in wei

  const estimatedCostInJuels =
    await subscriptionManager.estimateFunctionsRequestCost({
      donId: donId, // ID of the DON to which the Functions request will be sent
      subscriptionId: subscriptionId, // Subscription ID
      callbackGasLimit: gasLimit, // Total gas used by the consumer contract's callback
      gasPriceWei: BigInt(gasPriceWei), // Gas price in gWei
    });

  console.log(
    `Fulfillment cost estimated to ${ethers.utils.formatEther(
      estimatedCostInJuels
    )} LINK`
  );

  //////// MAKE REQUEST ////////
  console.log("\nMake request...");

  const functionsConsumer = new ethers.Contract(
    consumerAddress,
    functionsConsumerAbi,
    signer
  );

  // Actual transaction call
  const etherscanApiKey = process.env.ETHERSCAN_API_KEY; // fetch ETHERSCAN_API_KEY
  const transaction = await functionsConsumer.sendRequest(
    source, // source
    etherscanApiKey, // Encrypted URLs where to fetch user secrets
    args,
    subscriptionId,
    gasLimit,
    ethers.utils.formatBytes32String(donId) // jobId is bytes32 representation of donId
  );

  // Log transaction details
  console.log(
    `\n✅ Functions request sent! Transaction hash ${transaction.hash}. Waiting for a response...`
  );

  console.log(
    `See your request in the explorer ${explorerUrl}/tx/${transaction.hash}`
  );

  const responseListener = new ResponseListener({
    provider: provider,
    functionsRouterAddress: routerAddress,
  }); // Instantiate a ResponseListener object to wait for fulfillment.
  (async () => {
    try {
      const response = await new Promise((resolve, reject) => {
        responseListener
          .listenForResponseFromTransaction(transaction.hash)
          .then((response) => {
            resolve(response); // Resolves once the request has been fulfilled.
          })
          .catch((error) => {
            reject(error); // Indicate that an error occurred while waiting for fulfillment.
          });
      });

      const fulfillmentCode = response.fulfillmentCode;

      if (fulfillmentCode === FulfillmentCode.FULFILLED) {
        console.log(
          `\n✅ Request ${response.requestId} successfully fulfilled. Cost is ${ethers.utils.formatEther()} LINK.Complete reponse: `,
          response
        );
      } else if (fulfillmentCode === FulfillmentCode.USER_CALLBACK_ERROR) {
        console.log(
          `\n⚠️ Request ${response.requestId} fulfilled. However, the consumer contract callback failed. Cost is ${ethers.utils.formatEther(response.totalCostInJuels)} LINK.Complete reponse: `,
          response
        );
      } else {
        console.log(
          `\n❌ Request ${response.requestId} not fulfilled. Code: ${fulfillmentCode}. Cost is ${ethers.utils.formatEther(response.totalCostInJuels)} LINK.Complete reponse: `,
          response
        );
      }

      const errorString = response.errorString;
      if (errorString) {
        console.log(`\n❌ Error during the execution: `, errorString);
      } else {
        const responseBytesHexstring = response.responseBytesHexstring;
        if (ethers.utils.arrayify(responseBytesHexstring).length > 0) {
          const decodedResponse = decodeResult(
            response.responseBytesHexstring,
            ReturnType.string
          );
          console.log(
            `\n✅ Decoded response to ${ReturnType.string}: `,
            decodedResponse
          );
        }
      }
    } catch (error) {
      console.error("Error listening for response:", error);
    }
  })();
};

module.exports = { makeRequestSepolia };

// makeRequestSepolia().catch((e) => {
//   console.error(e);
//   process.exit(1);
// });