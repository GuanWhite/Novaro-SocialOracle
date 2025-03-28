const { types } = require("hardhat/config")
const { VERIFICATION_BLOCK_CONFIRMATIONS, networkConfig } = require("../network-config")

// npx hardhat functions-deploy-client --network network_name_here --verify true
task("deploy-functions-consumer-client", "Deploys the ChainlinkFunctionConsumer contract")
  .addOptionalParam("verify", "Set to true to verify client contract", true, types.boolean)
  .setAction(async (taskArgs, hre) => {
    const { ethers, network } = hre
    if (network.name === "hardhat") {
      throw Error(
        'This command cannot be used on a local hardhat chain.  Specify a valid network or simulate an ParametricInsurance request locally with "npx hardhat functions-simulate".'
      )
    }

    console.log("\nCompiling Contracts...")
    await hre.run("compile")

    const oracleAddress = networkConfig[network.name]["functionsOracleProxy"]
    console.log("Deploying ChainlinkFunctionConsumer contract to network:", network.name)
    const [deployer] = await ethers.getSigners()
    console.log("Deployer account:", deployer.address)

    const clientContractFactory = await ethers.getContractFactory("ChainlinkFunctionConsumer")
    const clientContract = await clientContractFactory.deploy(oracleAddress)

    console.log(
      `\nWaiting ${VERIFICATION_BLOCK_CONFIRMATIONS} blocks for transaction ${clientContract.deployTransaction.hash} to be confirmed...`
    )
    await clientContract.deployTransaction.wait(VERIFICATION_BLOCK_CONFIRMATIONS)

    const verifyContract = taskArgs.verify

    if (verifyContract && (process.env.POLYGONSCAN_API_KEY || process.env.ETHERSCAN_API_KEY)) {
      try {
        console.log("\nVerifying Contract...")
        await clientContract.deployTransaction.wait(Math.max(6 - VERIFICATION_BLOCK_CONFIRMATIONS, 0))
        await run("verify:verify", {
          address: clientContract.address,
          constructorArguments: [oracleAddress, clientAddress],
        })
        console.log("Contract verified")
      } catch (error) {
        if (!error.message.includes("Already Verified")) {
          console.log("Error verifying contract.  Delete the build folder and try again.")
          console.log(error)
        } else {
          console.log("Contract already verified")
        }
      }
    } else if (verifyContract) {
      console.log("\nPOLYGONSCAN_API_KEY or ETHERSCAN_API_KEY missing. Skipping contract verification...")
    }

    console.log(`\nChainlinkFunctionConsumer contract deployed to ${clientContract.address} on ${network.name}`)
  })