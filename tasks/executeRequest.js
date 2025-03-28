const consumerContractAbi = require("../artifacts/contracts/ChainlinkFunctionConsumer.sol/ChainlinkFunctionConsumer.json");

const { makeRequestSepolia } = require("../requests/getBalanceAndTotalGasFeeRequest.js");

task("functions-request", "Initiates a request from a Functions client contract")
  .addParam("accountAddress", "Account address for checking balance and gas fees")
  .addParam("consumerAddress", "Deploy functions consumer contract address")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;

		const accountAddress = taskArgs.accountAddress;
		makeRequestSepolia(accountAddress).catch((e) => {
			console.error(e);
			process.exit(1);
		});

    const consumerContractAddress = taskArgs.consumerAddress; // Replace with your consumer contract address
		const contract = new ethers.Contract(
			consumerContractAddress,
			consumerContractAbi,
			ethers.provider
		);

		try {
      const creditScore = await contract.getCreditScore();
      console.log(`The credit score of the account ${accountAddress} is: ${creditScore}`);
    } catch (error) {
      console.error("Error fetching score:", error);
    }
  }
)