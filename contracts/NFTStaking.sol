//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "./MYToken.sol";
import "./NFTContract.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "hardhat/console.sol";

contract NFTStaking is ERC1155Holder {
    MYToken private rewardTokens;
    NFTContract public stakeTokens;

    uint256 public totalStaked;
    uint256 public rewardAmount;
    uint256 public startTime;

    //mapping of user balances
    mapping(address => uint256) public stakingBalance;

    //mapping of user duration
    mapping(address => uint256) public stakeDuration;

    //mapping list of users who ever stake token
    mapping(address => bool) public hasStaked;

    address[] public stakers;

    event Staked(address user, uint256 stakeAmount, uint256 duration);
    event Unstaked(address user, uint256 tokenId);
    event RewardPointFor30(uint256 rewardbalance);
    event RewardPointFor180(uint256 rewardbalance1);
    event RewardPointFor365(uint256 rewardbalance2);

    constructor(MYToken rewardTokens_, NFTContract stakeTokens_) {
        stakeTokens = stakeTokens_;
        rewardTokens = rewardTokens_;
    }

    function stake(
        address user,
        uint256 tokenId,
        uint256 amount,
        uint256 duration
    ) external {
        require(user != address(0), "zero address");
        startTime = block.timestamp;

        _stake(user, tokenId, amount, duration);
    }

    function _stake(
        address _user,
        uint256 _tokenId,
        uint256 balance,
        uint256 duration
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

        stakingBalance[_user] += balance; //here update staking balance of user
        stakeDuration[_user] += duration;

        if (!hasStaked[_user]) {
            stakers.push(_user);
        }

        hasStaked[_user] = true;
        emit Staked(_user, balance, duration);
    }

    function unstake(uint256 tokenId) external {
        uint256 balance = stakingBalance[msg.sender];
        //console.log(balance);
        _unstake(balance, tokenId);
    }

    function _unstake(uint256 stakeAmount, uint256 tokenId) public {
        require(stakeAmount > 0, "amount has to be more than 0");
        uint256 stakingDuration = stakeDuration[msg.sender];

        //console.log(stakeTokens.balanceOf(msg.sender, 3));

        stakeTokens.safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            stakeAmount,
            ""
        );
        if (stakingDuration == 2592000) {
            rewardAmount = calculateRewardFor30(stakeAmount, stakingDuration);
        } else if (stakingDuration == 15552000) {
            rewardAmount = calculateRewardFor180(stakeAmount, stakingDuration);
        } else if (stakingDuration >= 31536000) {
            rewardAmount = calculateRewardFor365(stakeAmount, stakingDuration);
        }
        rewardTokens.transfer(msg.sender, rewardAmount);
        totalStaked -= stakeAmount;
        stakingBalance[msg.sender] -= stakeAmount;

        emit Unstaked(msg.sender, tokenId);
    }

    function calculateRewardFor30(uint256 stakeAmount, uint256 stakePeriod)
        internal
        returns (uint256 amountReward)
    {
        require(
            (block.timestamp - startTime) >= 2592000,
            "cuurent time is less than staking duration"
        );
        rewardAmount = (5 * stakePeriod * stakeAmount) / (100 * 365);
        emit RewardPointFor30(rewardAmount);
        return rewardAmount;
    }

    function calculateRewardFor180(uint256 stakeAmount, uint256 stakePeriod)
        internal
        returns (uint256 amountReward)
    {
        require(
            (block.timestamp - startTime) >= 15552000,
            "cuurent time is less than staking duration"
        );
        rewardAmount = (10 * stakePeriod * stakeAmount) / (100 * 365);
        emit RewardPointFor180(rewardAmount);
        return rewardAmount;
    }

    function calculateRewardFor365(uint256 stakeAmount, uint256 stakePeriod)
        internal
        returns (uint256 amountReward)
    {
        require(
            (block.timestamp - startTime) >= 31536000,
            "current time is less than staking duration"
        );
        rewardAmount = (15 * stakePeriod * stakeAmount) / (100 * 365);
        emit RewardPointFor365(rewardAmount);
        return rewardAmount;
    }
}
