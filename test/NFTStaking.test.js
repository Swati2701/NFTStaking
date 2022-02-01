/* eslint-disable */

const { BigNumber } = require('@ethersproject/bignumber')
const chai = require('chai')
const { expect, bignumber, assert } = chai
const { ethers, network } = require('hardhat')
const { solidity } = require('ethereum-waffle')
chai.use(solidity)

let nftContract, nftStaking, stake, myToken, owner, addr1, addr2, addr3, addrs

const now = async () => (await ethers.provider.getBlock('latest')).timestamp
let initalSupply = BigNumber.from(100000).mul(BigNumber.from(10).pow(18))

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
			await nftStaking.connect(addr1).stake(3, 1000 * 10 ** 9)

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
			await expect(nftStaking.connect(addr1).stake(1, 0)).to.be.reverted
		})

		// it('zero address', async () => {
		// 	await expect(
		// 		nftStaking.stake(
		// 			'0x0000000000000000000000000000000000000000',
		// 			1,
		// 			1000 * 10 ** 9
		// 		)
		// 	).to.be.revertedWith('zero address')
		// })

		it('stake more tokens', async () => {
			await nftContract.mintToken(addr1.address, initalSupply, '')
			await nftContract.balanceOf(addr1.address, 3)
			await nftContract
				.connect(addr1)
				.setApprovalForAll(nftStaking.address, true)
			await nftStaking.connect(addr1).stake(3, 1000 * 10 ** 9)

			let amount = BigNumber.from(1000).mul(BigNumber.from(10).pow(9))
			await nftStaking.onERC1155Received(
				nftStaking.address,
				addr1.address,
				3,
				amount,
				'0x00'
			)

			await nftContract.mintToken(addr2.address, initalSupply, '')
			await nftContract.balanceOf(addr2.address, 4)
			await nftContract
				.connect(addr2)
				.setApprovalForAll(nftStaking.address, true)
			await nftStaking.connect(addr2).stake(4, 25 * 10 ** 9)
			amount = BigNumber.from(25).mul(BigNumber.from(10).pow(9))
			await nftStaking.onERC1155Received(
				nftStaking.address,
				addr1.address,
				3,
				amount,
				'0x00'
			)

			let stakeAmount = await nftStaking.totalStaked()
			expect(stakeAmount.toString()).to.be.equal('1025000000000')

			expect(
				(await nftContract.balanceOf(nftStaking.address, 3)).toString()
			).to.be.equal('1000000000000')

			expect(
				(await nftContract.balanceOf(nftStaking.address, 4)).toString()
			).to.be.equal('25000000000')
		})
	})

	describe('unstake user amount', () => {
		it('staking id is different', async () => {
			const amount = BigNumber.from(1000).mul(BigNumber.from(10).pow(9))
			await nftContract.mintToken(addr1.address, initalSupply, '')
			await nftContract.balanceOf(addr1.address, 3)
			await nftContract
				.connect(addr1)
				.setApprovalForAll(nftStaking.address, true)

			await nftStaking.connect(addr1).stake(3, amount)

			await nftStaking.onERC1155Received(
				nftStaking.address,
				addr1.address,
				3,
				amount,
				'0x00'
			)

			await expect(nftStaking.connect(addr1).unstake(3, 2)).to.be.reverted
		})

		it('unstake amount after 30 days', async () => {
			const amount = BigNumber.from(1000).mul(BigNumber.from(10).pow(9))
			await nftContract.mintToken(addr1.address, initalSupply, '')
			await nftContract.balanceOf(addr1.address, 3)
			await nftContract
				.connect(addr1)
				.setApprovalForAll(nftStaking.address, true)

			await nftStaking.connect(addr1).stake(3, amount)

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

			await nftStaking.connect(addr1).unstake(1)

			let rewardPoint = await nftStaking.rewardAmount()
			expect(
				(await myToken.balanceOf(addr1.address)).toString()
			).to.be.equal(rewardPoint.toString())
		})

		it('unstake amount after 180 days', async () => {
			const amount = BigNumber.from(50).mul(BigNumber.from(10).pow(9))
			await nftContract.mintToken(addr1.address, initalSupply, '')
			await nftContract.balanceOf(addr1.address, 3)
			await nftContract
				.connect(addr1)
				.setApprovalForAll(nftStaking.address, true)

			await nftStaking.connect(addr1).stake(3, amount)

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

			await nftStaking.connect(addr1).unstake(1)

			let rewardPoint = await nftStaking.rewardAmount()
			expect(
				(await myToken.balanceOf(addr1.address)).toString()
			).to.be.equal(rewardPoint.toString())
		})

		it('unstake amount after 365 days', async () => {
			const amount = BigNumber.from(25).mul(BigNumber.from(10).pow(9))
			await nftContract.mintToken(addr1.address, initalSupply, '')
			await nftContract.balanceOf(addr1.address, 3)
			await nftContract
				.connect(addr1)
				.setApprovalForAll(nftStaking.address, true)

			await nftStaking.connect(addr1).stake(3, amount)
			//	await nftStaking.stake(addr1.address, 3, 20 * 10 ** 18)
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

			await nftStaking.connect(addr1).unstake(1)

			let rewardPoint = await nftStaking.rewardAmount()
			expect(
				(await myToken.balanceOf(addr1.address)).toString()
			).to.be.equal(rewardPoint.toString())
		})

		it('unstake more tokens at different time with different address', async () => {
			await nftContract.mintToken(addr1.address, initalSupply, '')
			await nftContract.balanceOf(addr1.address, 3)
			await nftContract
				.connect(addr1)
				.setApprovalForAll(nftStaking.address, true)
			await nftStaking.connect(addr1).stake(3, 1000 * 10 ** 9)

			//console.log(await nftStaking.stakerData)

			let amount = BigNumber.from(1000).mul(BigNumber.from(10).pow(9))
			await nftStaking.onERC1155Received(
				nftStaking.address,
				addr1.address,
				3,
				amount,
				'0x00'
			)

			await nftContract.mintToken(addr2.address, initalSupply, '')
			await nftContract.balanceOf(addr2.address, 4)
			await nftContract
				.connect(addr2)
				.setApprovalForAll(nftStaking.address, true)
			await nftStaking.connect(addr2).stake(4, 25 * 10 ** 9)
			amount = BigNumber.from(25).mul(BigNumber.from(10).pow(9))
			await nftStaking.onERC1155Received(
				nftStaking.address,
				addr2.address,
				4,
				amount,
				'0x00'
			)
			let stakeAmount = await nftStaking.totalStaked()
			expect(stakeAmount.toString()).to.be.equal('1025000000000')

			expect(
				(await nftContract.balanceOf(nftStaking.address, 3)).toString()
			).to.be.equal('1000000000000')

			expect(
				(await nftContract.balanceOf(nftStaking.address, 4)).toString()
			).to.be.equal('25000000000')

			let stakeTime = 181 * 24 * 60 * 60
			await ethers.provider.getBlock().timestamp

			await network.provider.send('evm_increaseTime', [stakeTime])
			await network.provider.send('evm_mine')

			await nftStaking.connect(addr2).unstake(2)
			let rewardPoint = await nftStaking.rewardAmount()
			expect(
				(await myToken.balanceOf(addr2.address)).toString()
			).to.be.equal(rewardPoint.toString())

			stakeTime = 31 * 24 * 60 * 60
			await ethers.provider.getBlock().timestamp

			await network.provider.send('evm_increaseTime', [stakeTime])
			await network.provider.send('evm_mine')
			await nftStaking.connect(addr1).unstake(1)

			rewardPoint = await nftStaking.rewardAmount()
			expect(
				(await myToken.balanceOf(addr1.address)).toString()
			).to.be.equal(rewardPoint.toString())
		})

		it('unstake more tokens with same address', async () => {
			await nftContract.mintToken(addr1.address, initalSupply, '')
			await nftContract.balanceOf(addr1.address, 3)
			await nftContract
				.connect(addr1)
				.setApprovalForAll(nftStaking.address, true)
			await nftStaking.connect(addr1).stake(3, 1000 * 10 ** 9)

			//console.log(await nftStaking.stakerData)

			let amount = BigNumber.from(1000).mul(BigNumber.from(10).pow(9))
			await nftStaking.onERC1155Received(
				nftStaking.address,
				addr1.address,
				3,
				amount,
				'0x00'
			)

			await nftContract.mintToken(addr1.address, initalSupply, '')
			await nftContract.balanceOf(addr1.address, 4)
			await nftContract
				.connect(addr1)
				.setApprovalForAll(nftStaking.address, true)

			await nftStaking.connect(addr1).stake(4, 25 * 10 ** 9)
			let stakeAmount = await nftStaking.totalStaked()
			expect(stakeAmount.toString()).to.be.equal('1025000000000')

			expect(
				(await nftContract.balanceOf(nftStaking.address, 3)).toString()
			).to.be.equal('1000000000000')

			expect(
				(await nftContract.balanceOf(nftStaking.address, 4)).toString()
			).to.be.equal('25000000000')

			stakeTime = 31 * 24 * 60 * 60
			await ethers.provider.getBlock().timestamp

			await network.provider.send('evm_increaseTime', [stakeTime])
			await network.provider.send('evm_mine')

			await nftStaking.connect(addr1).unstake(1)

			let rewardPoint = await nftStaking.rewardAmount()
			//console.log(rewardPoint.toString())
			expect(
				(await myToken.balanceOf(addr1.address)).toString()
			).to.be.equal(rewardPoint.toString())

			await nftStaking.connect(addr1).unstake(2)

			// rewardPoint = await nftStaking.rewardAmount()
			// console.log(rewardPoint.toString())
			// expect(
			// 	(await myToken.balanceOf(addr1.address)).toString()
			// ).to.be.equal(rewardPoint.toString())
		})
	})
})
