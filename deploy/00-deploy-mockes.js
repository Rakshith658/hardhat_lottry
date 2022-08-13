const { network } = require("hardhat")
const { developmentChainId } = require("../helper-hardhat-config")

const BASE_FEE = "250000000000000000" // 0.25 is this the premium in LINK?
const GAS_PRICE_LINK = 1e9

module.exports = async ({ getNamedAccounts, getChainId, deployments }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()

    if (developmentChainId.includes(network.name)) {
        log("deploying the contract to dev env...")
        const res = await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            args: [BASE_FEE, GAS_PRICE_LINK],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
        })
        console.log(res.contractName)
        log("Mock deployed ")
        log("----------------------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
