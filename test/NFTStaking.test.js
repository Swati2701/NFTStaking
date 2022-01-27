/* eslint-disable */

const { BigNumber } = require('@ethersproject/bignumber')
const chai = require('chai')
const { expect, bignumber, assert } = chai
const { ethers, network } = require('hardhat')
const { solidity } = require('ethereum-waffle')
chai.use(solidity)

let nftContract, nftStaking, stake, myToken, owner, addr1, addr2, addr3, addrs

const now = async () => (await ethers.provider.getBlock('latest')).timestamp
let initalSupply = BigNumber.from(1000).mul(BigNumber.from(10).pow(18))

describe('NFT Contract', () => {
	beforeEach(async () => {
		;[owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners()

		//deploy myToken contract
		const MYToken = await ethers.getContractFactory('MYToken')
		myToken = await MYToken.deploy()
		await myToken.deployed()

		//deploy nftContract
		const NFTContract = await ethers.getContractFactory('NFTContract')
		nftContract = await NFTContract.deploy()
		await nftContract.deployed()

		//Deploy NFTstaking contract
		const NFTStaking = await ethers.getContractFactory('NFTStaking')
		nftStaking = await NFTStaking.deploy(
			myToken.address,
			nftContract.address
		)
		await nftStaking.deployed()

		const amount = BigNumber.from(10000).mul(BigNumber.from(10).pow(18))
		await myToken.transfer(nftStaking.address, amount)
	})

	describe('Stake amount', () => {
		it('stake token', async () => {
			await nftContract.mintToken(addr1.address, initalSupply, '')
			await nftContract.balanceOf(addr1.address, 3)
			await nftContract
				.connect(addr1)
				.setApprovalForAll(nftStaking.address, true)

			// console.log(
			// 	await nftContract.isApprovedForAll(
			// 		addr1.address,
			// 		nftStaking.address
			// 	)
			// )
			await nftStaking.stake(
				addr1.address,
				3,
				1000 * 10 ** 9,
				(await now()) + 30 * 24 * 60 * 60
			)
			let amount = BigNumber.from(1000).mul(BigNumber.from(10).pow(9))
			await nftStaking.onERC1155Received(
				nftStaking.address,
				addr1.address,
				3,
				amount,
				'0x00'
			)
			let stakeAmount = await nftStaking.totalStaked()
			expect(stakeAmount.toString()).to.be.equal('1000000000000')

			expect(
				(await nftContract.balanceOf(nftStaking.address, 3)).toString()
			).to.be.equal('1000000000000')
		})
		it('amount is zero', async () => {
			await expect(
				nftStaking.stake(
					addr1.address,
					1,
					0,
					(await now()) + 30 * 24 * 60 * 60
				)
			).to.be.reverted
		})

		it('zero address', async () => {
			await expect(
				nftStaking.stake(
					'0x0000000000000000000000000000000000000000',
					1,
					1000 * 10 ** 9,
					(await now()) + 30 * 24 * 60 * 60
				)
			).to.be.revertedWith('zero address')
		})
	})

	describe('unstake user amount', () => {
		it('unstake amount after 30 days', async () => {
			await nftContract.mintToken(addr1.address, initalSupply, '')
			await nftContract.balanceOf(addr1.address, 3)
			await nftContract
				.connect(addr1)
				.setApprovalForAll(nftStaking.address, true)

			await nftStaking.stake(
				addr1.address,
				3,
				1000 * 10 ** 9,
				30 * 24 * 60 * 60
			)
			let amount = BigNumber.from(1000).mul(BigNumber.from(10).pow(9))
			await nftStaking.onERC1155Received(
				nftStaking.address,
				addr1.address,
				3,
				amount,
				'0x00'
			)

			let stakeTime = 31 * 24 * 60 * 60
			await ethers.provider.getBlock().timestamp

			await network.provider.send('evm_increaseTime', [stakeTime])
			await network.provider.send('evm_mine')

			// 	(await nftContract.balanceOf(addr1.address, 3))

			await nftStaking.connect(addr1).unstake(3)

			let rewardPoint = await nftStaking.rewardAmount()

			expect(
				(await myToken.balanceOf(addr1.address)).toString()
			).to.be.equal(rewardPoint.toString())
		})

		it('unstake amount before 30 days', async () => {
			await nftContract.mintToken(addr1.address, initalSupply, '')
			await nftContract.balanceOf(addr1.address, 3)
			await nftContract
				.connect(addr1)
				.setApprovalForAll(nftStaking.address, true)

			await nftStaking.stake(addr1.address, 3, 1000 * 10 ** 9, 2592000)
			let amount = BigNumber.from(1000).mul(10).pow(9)
			await nftStaking.onERC1155Received(
				nftStaking.address,
				addr1.address,
				3,
				amount,
				'0x00'
			)

			await expect(
				nftStaking.connect(addr1).unstake(3)
			).to.be.revertedWith('cuurent time is less than staking duration')
		})

		it('unstake amount after 180 days', async () => {
			const amount = BigNumber.from(50).mul(BigNumber.from(10).pow(9))
			await nftContract.mintToken(addr1.address, initalSupply, '')
			await nftContract.balanceOf(addr1.address, 3)
			await nftContract
				.connect(addr1)
				.setApprovalForAll(nftStaking.address, true)

			await nftStaking.stake(addr1.address, 3, amount, 15552000)

			await nftStaking.onERC1155Received(
				nftStaking.address,
				addr1.address,
				3,
				amount,
				'0x00'
			)

			let stakeTime = 181 * 24 * 60 * 60
			await ethers.provider.getBlock().timestamp

			await network.provider.send('evm_increaseTime', [stakeTime])
			await network.provider.send('evm_mine')

			await nftStaking.connect(addr1).unstake(3)

			let rewardPoint = await nftStaking.rewardAmount()
			expect(
				(await myToken.balanceOf(addr1.address)).toString()
			).to.be.equal(rewardPoint.toString())
		})

		it('unstake amount before 180 days', async () => {
			const amount = BigNumber.from(50).mul(BigNumber.from(10).pow(9))
			await nftContract.mintToken(addr1.address, initalSupply, '')
			await nftContract.balanceOf(addr1.address, 3)
			await nftContract
				.connect(addr1)
				.setApprovalForAll(nftStaking.address, true)

			await nftStaking.stake(addr1.address, 3, amount, 15552000)

			await nftStaking.onERC1155Received(
				nftStaking.address,
				addr1.address,
				3,
				amount,
				'0x00'
			)

			await expect(
				nftStaking.connect(addr1).unstake(3)
			).to.be.revertedWith('cuurent time is less than staking duration')
		})

		it('unstake amount after 365 days', async () => {
			const amount = BigNumber.from(25).mul(BigNumber.from(10).pow(9))
			await nftContract.mintToken(addr1.address, initalSupply, '')
			await nftContract.balanceOf(addr1.address, 3)
			await nftContract
				.connect(addr1)
				.setApprovalForAll(nftStaking.address, true)

			await nftStaking.stake(addr1.address, 3, amount, 31536000)

			await nftStaking.onERC1155Received(
				nftStaking.address,
				addr1.address,
				3,
				amount,
				'0x00'
			)

			let stakeTime = 366 * 24 * 60 * 60
			await ethers.provider.getBlock().timestamp

			await network.provider.send('evm_increaseTime', [stakeTime])
			await network.provider.send('evm_mine')

			await nftStaking.connect(addr1).unstake(3)

			let rewardPoint = await nftStaking.rewardAmount()
			expect(
				(await myToken.balanceOf(addr1.address)).toString()
			).to.be.equal(rewardPoint.toString())
		})

		it('unstake amount before 365 days', async () => {
			const amount = BigNumber.from(25).mul(BigNumber.from(10).pow(9))
			await nftContract.mintToken(addr1.address, initalSupply, '')
			await nftContract.balanceOf(addr1.address, 3)
			await nftContract
				.connect(addr1)
				.setApprovalForAll(nftStaking.address, true)

			await nftStaking.stake(addr1.address, 3, amount, 31536000)

			await nftStaking.onERC1155Received(
				nftStaking.address,
				addr1.address,
				3,
				amount,
				'0x00'
			)

			await expect(
				nftStaking.connect(addr1).unstake(3)
			).to.be.revertedWith('cuurent time is less than staking duration')
		})
	})
})
