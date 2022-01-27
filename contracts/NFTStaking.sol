//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "hardhat/console.sol";

contract NFTStaking is ERC1155Holder {
    IERC20 private rewardTokens;
    IERC1155 public stakeTokens;

    uint256 public totalStaked;
    uint256 public rewardAmount;
    uint256 public startTime;
    uint256 rate;

    struct stakingInfo {
        address user;
        uint256 stakingBalance;
        uint256 stakingDuration;
        uint256 tokenId;
        bool hasStaked;
    }

    //mapping of user data
    mapping(address => stakingInfo) public stakerData;

    address[] public stakers;

    event Staked(address user, uint256 stakeAmount, uint256 duration);
    event Unstaked(address user, uint256 tokenId);
    event RewardPoint(uint256 rewardbalance);

    constructor(IERC20 rewardTokens_, IERC1155 stakeTokens_) {
        stakeTokens = stakeTokens_;
        rewardTokens = rewardTokens_;
    }

    function stake(
        address user,
        uint256 tokenId,
        uint256 stakeAmount,
        uint256 duration
    ) external {
        stakingInfo storage stake_ = stakerData[user];
        require(user != address(0), "zero address");

        startTime = block.timestamp;
        stake_.user = user;
        stake_.stakingBalance = stakeAmount;
        stake_.tokenId = tokenId;
        stake_.stakingDuration = duration;
        if (!stake_.hasStaked) {
            stakers.push(user);
        }

        stake_.hasStaked = true;
        _stake(
            stake_.user,
            stake_.tokenId,
            stake_.stakingBalance,
            stake_.stakingDuration
        );
    }

    function _stake(
        address _user,
        uint256 _tokenId,
        uint256 balance,
        uint256 stakeDuration
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

        emit Staked(_user, balance, stakeDuration);
    }

    function unstake(uint256 tokenId) external {
        stakingInfo storage stake_ = stakerData[msg.sender];

        uint256 balance = stake_.stakingBalance;
        //   console.log(balance);
        _unstake(balance, tokenId);
    }

    function _unstake(uint256 stakeAmount, uint256 tokenId) public {
        require(stakeAmount > 0, "amount has to be more than 0");
        stakingInfo storage stake_ = stakerData[msg.sender];

        uint256 stakeDuration = stake_.stakingDuration;

        //console.log(stakeTokens.balanceOf(msg.sender, 3));

        stakeTokens.safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            stakeAmount,
            ""
        );
        if (30 days <= stakeDuration && stakeDuration < 180 days) {
            rate = 5;
            rewardAmount = calculateReward(rate, stakeAmount, stakeDuration);
            // console.log(rate, rewardAmount);
        } else if (180 days <= stakeDuration && stakeDuration < 365 days) {
            rate = 10;
            rewardAmount = calculateReward(rate, stakeAmount, stakeDuration);
            // console.log(rate, rewardAmount);
        } else if (stakeDuration >= 365 days) {
            rate = 15;
            rewardAmount = calculateReward(rate, stakeAmount, stakeDuration);
            // console.log(rate, rewardAmount);
        }
        rewardTokens.transfer(msg.sender, rewardAmount);

        totalStaked -= stakeAmount;
        stake_.stakingBalance -= stakeAmount;

        emit Unstaked(msg.sender, tokenId);
    }

    function calculateReward(
        uint256 interestaRate,
        uint256 stakeAmount,
        uint256 stakePeriod
    ) internal returns (uint256 amountReward) {
        require(
            (block.timestamp - startTime) >= stakePeriod,
            "cuurent time is less than staking duration"
        );
        rewardAmount =
            (interestaRate * stakePeriod * stakeAmount) /
            (100 * 365 days);
        emit RewardPoint(rewardAmount);
        return rewardAmount;
    }
}
