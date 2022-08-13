const { network, getNamedAccounts, ethers, deployments } = require("hardhat")
const { developmentChainId } = require("../../helper-hardhat-config")

developmentChainId.includes(network.name)
  ? describe.skip
  : describe("Raffle", async () => {
      const { fixture } = deployments
      let Raffle, deployer, raffleEntranceFee
      // log("describe")
      beforeEach(async () => {
        // accounts = await ethers.getSigners()
        deployer = (await getNamedAccounts()).deployer
        Raffle = await ethers.getContract("Raffle", deployer)
        raffleEntranceFee = await Raffle.getEntrenicesFee()
      })

      describe("enter Raffle", async () => {
        it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async () => {
          // enter Raffle
          console.log("setting the test")
          const startingTimeStamp = await Raffle.getLastTimeStamp()
          const accounts = await ethers.getSigners()

          console.log("setting the listeners")
          await new Promise(async (resolve, reject) => {
            Raffle.once("Winner_Picked", async () => {
              console.log("winnner picked")
              try {
                const recentWinner = await Raffle.getRecentWinner()
                const raffleState = await Raffle.getRaffleStatus()
                // const winnerBalance = await players
                //   .find((e) => e.address == recentWinner)
                //   .getBalance()
                const endingTimeStamp = await Raffle.getLastTimeStamp()
                await expect(Raffle.getplayer(0)).to.be.reverted
                assert.equal(
                  recentWinner.toString(),
                  players.find((e) => e.address == recentWinner).address
                )
                assert.equal(raffleState, 0)
                assert(endingTimeStamp > startingTimeStamp)
                resolve()
              } catch (error) {
                reject(error)
              }
            })
            // Then entering the raffle
            console.log("Entering Raffle...")
            const tx = await Raffle.EnterRaffle({ value: raffleEntranceFee })
            await tx.wait(1)
            console.log("Ok, time to wait...")
          })
        })
      })
    })
