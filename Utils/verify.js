const { run } = require("hardhat")

const verify = async (contractAddress, agrs) => {
    try {
        console.log("verifying the contract....")
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: agrs,
        })
    } catch (error) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("already verified")
        } else {
            console.log(error.message)
        }
    }
}

module.exports = {
    verify,
}
