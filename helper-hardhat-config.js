const { ethers } = require("hardhat")

const developmentChainId = ["hardhat", "localhost"]
const networkConfig = {
  4: {
    name: "rinkeby",
    minmunEth: ethers.utils.parseEther("0.0001"), //0.1 eth
    vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
    gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    callbackGasLimit: 100000,
    subscriptionId: "10357",
    keepersUpdateInterval: "5",
  },
  137: {
    name: "polygon",
    minmunEth: "100000000000000000", //0.1 eth
    vrfCoordinatorV2: "	0xAE975071Be8F8eE67addBC1A82488F1C24858067",
    gasLane: "0xd729dc84e21ae57ffb6be0053bf2b0668aa2aaf300a2a7b2ddf7dc0bb6e875a8",
    callbackGasLimit: 100000,
    keepersUpdateInterval: "30",
  },
  1: {
    name: "mainnet",
    keepersUpdateInterval: "30",
  },
  31337: {
    minmunEth: "100000000000000000", //0.1 eth
    gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    callbackGasLimit: 100000,
    keepersUpdateInterval: "30",
  },
}

module.exports = {
  developmentChainId,
  networkConfig,
}
