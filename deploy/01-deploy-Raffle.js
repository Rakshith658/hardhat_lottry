const { ethers, network } = require("hardhat")
const { developmentChainId, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../Utils/verify")

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = await getChainId()
    const FUND_AMOUNT = "1000000000000000000000"
    let vrfCoordinatorV2, subscriptionId
    if (developmentChainId.includes(network.name)) {
        const mockvrfCoordinatorV2 = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2 = mockvrfCoordinatorV2.address
        const transactionResponse = await mockvrfCoordinatorV2.createSubscription()
        const transactionReceipt = await transactionResponse.wait()
        subscriptionId = transactionReceipt.events[0].args.subId
        // Fund the subscription
        // Our mock makes it so we don't actually have to worry about sending fund
        await mockvrfCoordinatorV2.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2 = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }
    const arguments = [
        networkConfig[chainId].minmunEth,
        vrfCoordinatorV2,
        networkConfig[chainId].gasLane,
        subscriptionId,
        networkConfig[chainId].callbackGasLimit,
        networkConfig[chainId].keepersUpdateInterval,
    ]

    const Raffle = await deploy("Raffle", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    console.log(Raffle.address)
    if (!developmentChainId.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(Raffle.address, arguments)
    }
}

module.exports.tags = ["all", "Raffle"]
