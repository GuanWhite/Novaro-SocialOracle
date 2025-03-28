require("@nomicfoundation/hardhat-toolbox");
const glob = require("glob");
const path = require("path");
require('dotenv').config();

glob.sync("./tasks/**/*.js").forEach(function (file) {
  require(path.resolve(file));
});

const PRIVATE_KEY = process.env.PRIVATE_KEY
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      accounts: process.env.PRIVATE_KEY
        ? [
            {
              privateKey: process.env.PRIVATE_KEY,
              balance: "10000000000000000000000",
            },
          ]
        : {},
    },
    sepolia: {
      url: SEPOLIA_RPC_URL || "UNSET",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 11155111,
      nativeCurrencySymbol: "ETH",
      nativeCurrencyDecimals: 18,
      nativePriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
      mainnet: false,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
};
