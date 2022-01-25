/* eslint-disable */

const { BigNumber } = require('@ethersproject/bignumber')
const chai = require('chai')
const { expect, bignumber, assert } = chai
const { ethers, network } = require('hardhat')
const { solidity } = require('ethereum-waffle')
chai.use(solidity)

let myToken, owner, addr1, addrs

describe('my Token', () => {
	beforeEach(async () => {
		;[owner, addr1, ...addrs] = await ethers.getSigners()

		const MYToken = await ethers.getContractFactory('MYToken')

		myToken = await MYToken.deploy()
		await myToken.deployed()
	})

	describe('token attributes', () => {
		it('has the correct name', async function () {
			expect(await myToken.name()).to.equal('My Token')
		})

		it('has the correct symbol', async function () {
			expect(await myToken.symbol()).to.equal('MT')
		})

		it('has the correct decimals', async function () {
			expect(await myToken.decimals()).to.equal(18)
		})
	})

	describe('Burn tokens', () => {
		it('Burn token', async function () {
			const before_burn = await myToken.balanceOf(owner.address)

			await myToken.burnToken(1000000000)
			let amount = BigNumber.from(before_burn).sub(
				BigNumber.from(1).mul(10 ** 9)
			)

			let after_burn = await myToken.balanceOf(owner.address)

			expect(amount).to.be.equal(after_burn)
		})
	})
})
