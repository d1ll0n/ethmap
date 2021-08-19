module.exports = async function deployAaveV1ProtocolAdapter(hre) {
  const { getNamedAccounts, deployments } = hre
  const { deployer } = await getNamedAccounts()
  await deployments.deploy('ETHMapZones', {
    from: deployer,
    gasLimit: 4000000,
    args: ['0x91710D0EDb30FB08088405d424Ec3cb1515db313'],
    nonce: 1038
  })
}