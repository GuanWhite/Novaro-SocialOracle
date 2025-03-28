# novaro-social-oracle

## prepare the environment

```bash
npm install
```

Prepare environment variables in the .env file:

SEPOLIA_RPC_URL=""
PRIVATE_KEY=""
ETHERSCAN_API_KEY=""

Prepare the subscription ID for Chainlink Functions: https://functions.chain.link/sepolia


## deploy the contract

```bash
npx hardhat deploy-functions-consumer-client --network sepolia
```

Fill in the consumeraddress and subscriptionId of the ChainlinkFunctionConsumer contract deployed on the Sepolia network into the ./questions/getBalanceAndTotalGasFeeRequest.js file.

## execute the request and get the credit score

```bash
npx hardhat functions-request --network sepolia --accountAddress 0x01 --consumerAddress 0x02
```