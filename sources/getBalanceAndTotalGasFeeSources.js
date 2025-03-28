
const userAddress = args;

const baseUrl = `https://api.etherscan.io/api`;

const getBalanceRequest = Functions.makeHttpRequest({
  url: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  params: {
    module: "account",
    action: "balance",
    address: userAddress,
    tag: "latest",
    apikey: process.env.ETHERSCAN_API_KEY,
  },
});
console.log(`HTTP GET Request to ${baseUrl}?module=account&action=balance&address=${userAddress}&tag=latest&apikey=${process.env.ETHERSCAN_API_KEY}`);

const getTransactionListRequest = Functions.makeHttpRequest({
	url: baseUrl,
	headers: {
		"Content-Type": "application/json",
	},
	params: {
		module: "account",
		action: "txlist",
		address: userAddress,
		startblock: 0,
		endblock: 99999999,
		sort: "asc",
		apikey: process.env.ETHERSCAN_API_KEY,
	},
});
console.log(`HTTP GET Request to ${baseUrl}?module=account&action=txlist&address=${userAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.ETHERSCAN_API_KEY}`);

const getBalanceResponse = await getBalanceRequest;
if (getBalanceResponse.error) {
  console.error(getBalanceResponse.error);
  throw Error("get Balance Request failed");
}

const balanceData = getBalanceResponse["data"];
if (balanceData.Response === "Error") {
  console.error(balanceData.Message);
  throw Error(`Functional error. Read message: ${balanceData.Message}`);
}

// extract the balancefrom the response data
const balance = balanceData["result"];
console.log(`User ${userAddress} has a balance of ${balance} wei`);

const getTransactionListResponse = await getTransactionListRequest;
if (getTransactionListResponse.error) {
  console.error(getTransactionListResponse.error);
  throw Error("get Transaction List Request failed");
}
  
const transactionListData = getTransactionListResponse["data"];
if (transactionListData.Response === "Error") {
  console.error(transactionListData.Message);
  throw Error(`Functional error. Read message: ${transactionListData.Message}`);
}

let totalGasWei = 0;
transactionListData["result"].forEach((tx) => {
	// Only count transactions that user Address cost gas
	if(tx["from"].toLowerCase() === userAddress.toLowerCase())
		totalGasWei += BigInt(tx["gasUsed"]) * BigInt(tx["gasPrice"]);
});
console.log(`${userAddress} has spent ${totalGasWei} WEI on the transactions`);

const result = {
	balance: balance,
	totalGasWei: totalGasWei,
};

return Functions.encodeString(JSON.stringify(result))