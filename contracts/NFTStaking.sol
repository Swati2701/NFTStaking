//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract NFTStaking is ERC1155Holder {
    IERC20 private rewardTokens;
    IERC1155 public stakeTokens;

    uint256 public totalStaked;
    uint256 public rewardAmount;
    uint256 stakeId = 1;
    struct StakingInfo {
        address user;
        uint256 startTime;
        uint256 stakingBalance;
        uint256 tokenId;
    }

    //mapping of user data
    mapping(uint256 => StakingInfo) public stakerData;

    event Staked(address user, uint256 stakeAmount);
    event Unstaked(address user, uint256 tokenId);

    constructor(IERC20 rewardTokens_, IERC1155 stakeTokens_) {
        stakeTokens = stakeTokens_;
        rewardTokens = rewardTokens_;
    }

    function stake(uint256 _tokenId, uint256 _stakeAmount) external {
        StakingInfo storage stake_ = stakerData[stakeId];
        require(msg.sender != address(0), "zero address");

        stake_.user = msg.sender;
        stake_.startTime = block.timestamp;
        stake_.stakingBalance = _stakeAmount;
        stake_.tokenId = (_tokenId);
        stakeId++;

        _stake(msg.sender, _tokenId, stake_.stakingBalance);
    }

    function _stake(
        address _user,
        uint256 _tokenId,
        uint256 balance
    ) public {
        require(balance > 0, "cannot stake");

        stakeTokens.safeTransferFrom(
            _user,
            address(this),
            _tokenId,
            balance,
            ""
        );

        totalStaked += balance;

        emit Staked(_user, balance);
    }

    function unstake(uint256 _stakeId) external {
        StakingInfo storage stake_ = stakerData[_stakeId];
        require(stake_.stakingBalance > 0, "amount has to be more than 0");
        require(stake_.user == msg.sender, "User staking id is different");
        uint256 stakeDuration = block.timestamp - stake_.startTime;
        uint256 stakeAmount = stake_.stakingBalance;
        stakeTokens.safeTransferFrom(
            address(this),
            msg.sender,
            stake_.tokenId,
            stakeAmount,
            ""
        );

        if (stakeDuration >= 30 days && stakeDuration < 180 days) {
            rewardAmount = calculateReward(5, stakeAmount, 30 days);
        } else if (stakeDuration >= 180 days && stakeDuration < 365 days) {
            rewardAmount = calculateReward(10, stakeAmount, 180 days);
        } else if (stakeDuration >= 365 days) {
            rewardAmount = calculateReward(15, stakeAmount, 365 days);
        }
        rewardTokens.transfer(msg.sender, rewardAmount);

        totalStaked -= stakeAmount;
        stake_.stakingBalance -= stakeAmount;
        delete stakerData[_stakeId];
        emit Unstaked(msg.sender, stake_.tokenId);
    }

    function calculateReward(
        uint256 interestaRate,
        uint256 stakeAmount,
        uint256 stakePeriod
    ) internal returns (uint256 amountReward) {
        rewardAmount =
            (interestaRate * stakePeriod * stakeAmount) /
            (100 * 365 days);
        return rewardAmount;
    }
}
