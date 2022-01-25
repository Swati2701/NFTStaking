/* eslint-disable */

const { BigNumber } = require('@ethersproject/bignumber')
const chai = require('chai')
const { expect, bignumber, assert } = chai
const { ethers, network } = require('hardhat')
const { solidity } = require('ethereum-waffle')
chai.use(solidity)

let nftContract, owner, addr1, addr2, addr3, addrs

describe('NFT Contract', () => {
	beforeEach(async () => {
		;[owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners()

		const NFTContract = await ethers.getContractFactory('NFTContract')

		nftContract = await NFTContract.deploy()
		await nftContract.deployed()
	})

	describe('mint token', () => {
		it('mint token & checking tokenId increases ', async function () {
			let before_mint = await nftContract.balanceOf(addr1.address, 3)
			let mintAmount = BigNumber.from(1000000).mul(
				BigNumber.from(10).pow(18)
			)

			await nftContract.mintToken(addr1.address, mintAmount, '')
			let after_mint = await nftContract.balanceOf(addr1.address, 3)
			expect(after_mint.toString()).to.be.equal(mintAmount)

			before_mint = await nftContract.balanceOf(addr2.address, 4)
			mintAmount = BigNumber.from(5000000).mul(BigNumber.from(10).pow(18))
			await nftContract.mintToken(addr2.address, mintAmount, '')
			after_mint = await nftContract.balanceOf(addr2.address, 4)
			expect(after_mint.toString()).to.be.equal(mintAmount)
		})

		it('mint batch token', async function () {
			let before_mint = await nftContract.balanceOfBatch(
				[addr3.address, addr3.address],
				[1, 2]
			)
			let mintAmount = BigNumber.from(2000000).mul(
				BigNumber.from(10).pow(18)
			)
			let mintAmount1 = BigNumber.from(4000000).mul(
				BigNumber.from(10).pow(18)
			)
			await nftContract.mintBatchToken(
				addr3.address,
				[mintAmount, mintAmount1],
				''
			)

			let after_mint = await nftContract.balanceOfBatch(
				[addr3.address, addr3.address],
				[1, 2]
			)
			expect(after_mint[0].toString()).to.be.equal(mintAmount)
			expect(after_mint[1].toString()).to.be.equal(mintAmount1)
		})
	})
})
