// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

error Raffle_NotEnoughEth();
error Raffle_SendEthFailed();
error Raffle_UpKeepNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);
error Raffle_NotOpened();

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
  // types
  enum Raffle_Status {
    OPEN,
    CALCULATING
  }

  // State variables
  uint256 private immutable i_entrenciesFee;
  address payable[] private s_players;
  VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
  uint256 public s_requestId;
  uint64 public immutable s_subscriptionId;
  bytes32 private immutable keyHash;
  uint32 private immutable i_callbackGasLimit;
  uint16 private constant requestConfirmations = 3;
  uint32 private constant numWords = 1;
  Raffle_Status private s_Raffle_Status;

  //lottery recent winner914882534811 Number`
  address private s_recentWinner;
  uint256 public s_interval;
  uint256 public lastTimeStamp;

  //events
  event RaffleEnter(address indexed player);
  event Request_RaffleWinner(uint256 indexed requestId);
  event Winner_Picked(address indexed player);

  constructor(
    uint256 entrenciesFee,
    address vrfCoordinatorV2, // contract address
    bytes32 gasLane, // keyHash
    uint64 subscriptionId,
    uint32 callbackGasLimit,
    uint256 interval
  ) VRFConsumerBaseV2(vrfCoordinatorV2) {
    i_entrenciesFee = entrenciesFee;
    i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
    keyHash = gasLane;
    s_subscriptionId = subscriptionId;
    i_callbackGasLimit = callbackGasLimit;
    lastTimeStamp = block.timestamp;
    s_interval = interval;
    s_Raffle_Status = Raffle_Status.OPEN;
  }

  function EnterRaffle() public payable {
    if (msg.value < i_entrenciesFee) revert Raffle_NotEnoughEth();
    if (s_Raffle_Status != Raffle_Status.OPEN) revert Raffle_NotOpened();
    s_players.push(payable(msg.sender));
    emit RaffleEnter(msg.sender);
  }

  function checkUpkeep(
    bytes memory /* checkData */
  )
    public
    view
    override
    returns (
      bool upkeepNeeded,
      bytes memory /* performData */
    )
  {
    // We don't use the checkData in this example. The checkData is defined when the Upkeep was registered.
    bool isOpen = Raffle_Status.OPEN == s_Raffle_Status;
    bool isPlayer = s_players.length > 0;
    bool isBalance = address(this).balance > 0;
    bool isTimeStamp = ((block.timestamp - lastTimeStamp) > s_interval);
    upkeepNeeded = (isOpen && isPlayer && isBalance && isTimeStamp);
    return (upkeepNeeded, "0*0");
  }

  function performUpkeep(
    bytes calldata /* performData */
  ) external override {
    (bool upkeepNeeded, ) = checkUpkeep("");
    if (!upkeepNeeded) {
      revert Raffle_UpKeepNeeded(address(this).balance, s_players.length, uint256(s_Raffle_Status));
    }
    s_Raffle_Status = Raffle_Status.CALCULATING;
    s_requestId = i_vrfCoordinator.requestRandomWords(
      keyHash,
      s_subscriptionId,
      requestConfirmations,
      i_callbackGasLimit,
      numWords
    );
    emit Request_RaffleWinner(s_requestId);
  }

  function fulfillRandomWords(
    uint256, /*requestId*/
    uint256[] memory randomWords
  ) internal override {
    uint256 winnerIndex = randomWords[0] % s_players.length;
    address payable winner = s_players[winnerIndex];
    s_recentWinner = winner;
    s_players = new address payable[](0);
    s_Raffle_Status = Raffle_Status.OPEN;
    lastTimeStamp = block.timestamp;
    (
      bool callSuccess, // bytes memory dataReturn

    ) = payable(winner).call{value: address(this).balance}("");
    if (!callSuccess) {
      revert Raffle_SendEthFailed();
    }
    emit Winner_Picked(s_recentWinner);
  }

  /*View / Pure function */
  function getEntrenicesFee() public view returns (uint256) {
    return i_entrenciesFee;
  }

  function getplayer(uint256 index) public view returns (address) {
    return s_players[index];
  }

  function getRecentWinner() public view returns (address) {
    return s_recentWinner;
  }

  function getRaffleStatus() public view returns (Raffle_Status) {
    return s_Raffle_Status;
  }

  function getLastTimeStamp() public view returns (uint256) {
    return lastTimeStamp;
  }

  function getNumberOfPlayers() public view returns (uint256) {
    return s_players.length;
  }

  function getInterval() public view returns (uint256) {
    return s_interval;
  }

  function getNumWord() public pure returns (uint32) {
    return numWords;
  }

  function getrequestConfirmations() public pure returns (uint256) {
    return requestConfirmations;
  }

  function getvrfCoordinator() public view returns (VRFCoordinatorV2Interface) {
    return i_vrfCoordinator;
  }
}
