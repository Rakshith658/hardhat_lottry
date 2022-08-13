const { assert, expect } = require("chai")
const { deployments, getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChainId, networkConfig } = require("../../helper-hardhat-config")

!developmentChainId.includes(network.name)
  ? describe.skip
  : describe("Raffle", async () => {
      const { fixture } = deployments
      let Raffle, deployer, mockvrfCoordinatorV2, interval
      // log("describe")
      beforeEach(async () => {
        // accounts = await ethers.getSigners()
        deployer = (await getNamedAccounts()).deployer
        await fixture(["all"])
        Raffle = await ethers.getContract("Raffle", deployer)
        mockvrfCoordinatorV2 = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
        interval = await Raffle.getInterval()
      })
      describe("Constructer", async () => {
        it("it should return the same value as we sent", async () => {
          const res = await Raffle.getEntrenicesFee()
          assert.equal(res.toString(), networkConfig[network.config.chainId].minmunEth.toString())
        })
        it("Mock address check", async () => {
          const res = await Raffle.getvrfCoordinator()
          assert.equal(res, mockvrfCoordinatorV2.address)
        })
      })

      describe("EnterRaffle", async () => {
        it("it revert", async () => {
          await expect(Raffle.EnterRaffle()).to.be.revertedWith("Raffle_NotEnoughEth")
        })
        it("it should be added to player array", async () => {
          await Raffle.EnterRaffle({ value: ethers.utils.parseEther("1") })
          const res = await Raffle.getplayer(0)
          assert.equal(res, deployer)
        })

        it("it should emit events", async () => {
          await expect(Raffle.EnterRaffle({ value: ethers.utils.parseEther("1") })).to.emit(
            Raffle,
            "RaffleEnter"
          )
        })
        it("it should revert if it is calculting", async () => {
          await Raffle.EnterRaffle({ value: ethers.utils.parseEther("1") })
          await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
          await network.provider.request({ method: "evm_mine", params: [] })
          await Raffle.performUpkeep([]) // changes the state to calculating for our comparison below
          await expect(
            Raffle.EnterRaffle({ value: ethers.utils.parseEther("1") })
          ).to.be.revertedWith(
            // is reverted as raffle is calculating
            "Raffle_NotOpened"
          )
        })
      })

      describe("checkUpkeep", () => {
        it("it should return false if people isn't sent eth", async () => {
          await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
          await network.provider.request({ method: "evm_mine", params: [] })
          const { upkeepNeeded } = await Raffle.checkUpkeep("0x")
          assert.equal(upkeepNeeded, false)
        })
        it("it should return false if there is no player", async () => {
          const { upkeepNeeded } = await Raffle.checkUpkeep("0x")
          assert.equal(upkeepNeeded, false)
        })

        it("it should return false if Raffle is not open", async () => {
          await Raffle.EnterRaffle({ value: ethers.utils.parseEther("1") })
          await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
          await network.provider.request({ method: "evm_mine", params: [] })
          await Raffle.performUpkeep([])
          const raffleState = await Raffle.getRaffleStatus()
          const { upkeepNeeded } = await Raffle.checkUpkeep("0x")
          assert.equal(upkeepNeeded == false, raffleState.toString() == "1")
        })

        it("it should return false if not enough time has passed", async () => {
          await Raffle.EnterRaffle({ value: ethers.utils.parseEther("1") })
          await network.provider.send("evm_increaseTime", [interval.toNumber() - 1])
          await network.provider.request({ method: "evm_mine", params: [] })
          const { upkeepNeeded } = await Raffle.checkUpkeep("0x")
          assert(!upkeepNeeded)
        })

        it("it should return true if all the thing are good", async () => {
          await Raffle.EnterRaffle({ value: ethers.utils.parseEther("1") })
          await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
          await network.provider.request({ method: "evm_mine", params: [] })
          const { upkeepNeeded } = await Raffle.checkUpkeep("0x")
          assert.equal(upkeepNeeded, true)
        })
      })
      describe("performUpkeep", async () => {
        it("it should only run if checkupkeep is true", async () => {
          await Raffle.EnterRaffle({ value: ethers.utils.parseEther("1") })
          await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
          await network.provider.request({ method: "evm_mine", params: [] })
          const res = await Raffle.performUpkeep("0x")
          assert(res)
        })
        it("it should revert is checkUpkeep is false", async () => {
          expect(Raffle.performUpkeep("0x")).to.be.revertedWith("Raffle_UpKeepNeeded")
        })

        it("update the state and emit the requestid", async () => {
          await Raffle.EnterRaffle({ value: ethers.utils.parseEther("1") })
          await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
          await network.provider.request({ method: "evm_mine", params: [] })
          const res = await Raffle.performUpkeep("0x")
          const txReceipt = await res.wait(1)
          const raffleState = await Raffle.getRaffleStatus()
          const requestid = txReceipt.events[1].args.requestId
          expect(requestid > 0)
          expect(raffleState == 1)
        })
      })
      describe("full fill Random words", async () => {
        beforeEach(async () => {
          await Raffle.EnterRaffle({ value: ethers.utils.parseEther("1") })
          await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
          await network.provider.request({ method: "evm_mine", params: [] })
        })
        it("can only be called after performupkeep", async () => {
          await expect(
            mockvrfCoordinatorV2.fulfillRandomWords(0, Raffle.address) // reverts if not fulfilled
          ).to.be.revertedWith("nonexistent request")
          await expect(
            mockvrfCoordinatorV2.fulfillRandomWords(1, Raffle.address) // reverts if not fulfilled
          ).to.be.revertedWith("nonexistent request")
        })

        it("picking the winner ,resets and sends money", async () => {
          const playerEnterRaffle = 3
          const startingIndex = 1
          const players = await ethers.getSigners()

          for (let i = 0; i < startingIndex + playerEnterRaffle; i++) {
            const element = await Raffle.connect(players[i])
            await element.EnterRaffle({ value: ethers.utils.parseEther("1") })
          }

          const startingTimeStamp = await Raffle.getLastTimeStamp()

          await new Promise(async (resolve, reject) => {
            Raffle.once("Winner_Picked", async () => {
              try {
                const recentWinner = await Raffle.getRecentWinner()
                const raffleState = await Raffle.getRaffleStatus()
                const winnerBalance = await players
                  .find((e) => e.address == recentWinner)
                  .getBalance()
                const endingTimeStamp = await Raffle.getLastTimeStamp()
                await expect(Raffle.getplayer(0)).to.be.reverted
                // Comparisons to check if our ending values are correct:
                assert.equal(
                  recentWinner.toString(),
                  players.find((e) => e.address == recentWinner).address
                )
                assert.equal(raffleState, 0)
                // assert.equal(
                //   winnerBalance.toString(),
                //   startingBalance // startingBalance + ( (raffleEntranceFee * additionalEntrances) + raffleEntranceFee )
                //     .add(
                //       ethers.utils
                //         .parseEther("1")
                //         .mul(playerEnterRaffle)
                //         .add(ethers.utils.parseEther("1"))
                //     )
                //     .toString()
                // )
                assert(endingTimeStamp > startingTimeStamp)
                resolve()
              } catch (error) {
                reject(error)
              }
            })
            const tx = await Raffle.performUpkeep("0x")
            const txReceipt = await tx.wait(1)
            // const startingBalance = await players[2].getBalance()
            await mockvrfCoordinatorV2.fulfillRandomWords(
              txReceipt.events[1].args.requestId,
              Raffle.address
            )
          })
        })
      })
    })
