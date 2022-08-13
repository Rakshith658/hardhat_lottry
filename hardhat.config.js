require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config({ path: __dirname + "/.env.dev" })

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.7",
      },
      {
        version: "0.4.24",
      },
    ],
  },
  defaultNetwork: "hardhat",
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_RPC_URL,
      accounts: [process.env.ACCOUNT_ID],
      chainId: 4,
      blockConfirations: 6,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0,
      4: 0,
    },
    player: {
      default: 1,
    },
  },
  gasReporter: {
    enabled: false,
    currency: "INR",
    outputFile: "gas-reporter.txt",
    noColors: true,
    // coinmarketcap: process.env.COINMARKETCAP_KEY,
    token: "MATIC", // if we deploy on polgan //for moreinfo visit https://www.npmjs.com/package/hardhat-gas-reporter // token and gasPriceApi options example
  },
  mocha: {
    timeout: 500000, // 500 seconds max for running tests
  },
  contractSizer: {
    runOnCompile: false,
    only: ["Raffle"],
  },
}
