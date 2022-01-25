const hre = require('hardhat')

async function main() {
	//deploy myToken contract
	const MYToken = await ethers.getContractFactory('MYToken')
	let myToken = await MYToken.deploy()
	await myToken.deployed()

	//deploy nftContract
	const NFTContract = await ethers.getContractFactory('NFTContract')
	let nftContract = await NFTContract.deploy()
	await nftContract.deployed()

	//Deploy NFTstaking contract
	const NFTStaking = await ethers.getContractFactory('NFTStaking')
	let nftStaking = await NFTStaking.deploy(
		myToken.address,
		nftContract.address
	)
	await nftStaking.deployed()

	console.log('my token(erc20) address', myToken.address)
	console.log('nft contract address', nftContract.address)
	console.log('nft staking address', nftStaking.address)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
