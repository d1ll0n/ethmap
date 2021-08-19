import { expect } from "chai"
import { constants } from "ethers"
import { ethers, waffle } from "hardhat"
import { ETHMapZones, IEthMap } from "../typechain"
import { createSnapshot, deployContract, impersonate, stopImpersonating } from "./utils"

describe('ETHMapZones.sol', () => {
  const [wallet, wallet1] = waffle.provider.getWallets()

  let map: IEthMap
  let zones: ETHMapZones

  let reset: () => Promise<void>

  before(async () => {
    map = await ethers.getContractAt('IEthMap', '0xB6bbf89c3DbBa20Cb4d5cABAa4A386ACbbAb455e')
    zones = await deployContract<ETHMapZones>('ETHMapZones')
    reset = await createSnapshot()
  })

  beforeEach(() => reset())

  async function stealZone(id: number) {
    const { owner } = await map.getZone(id)
    const signer = await impersonate(owner)
    await map.connect(signer).transferZone(id, wallet.address)
    await stopImpersonating(owner)
  }

  describe('Settings', () => {
    it('proxyRegistryAddress()', async () => {
      expect(await zones.proxyRegistryAddress()).to.eq('0xa5409ec958C83C3f309868babACA7c86DCB077c1')
    })

    it('map()', async () => {
      expect(await zones.map()).to.eq(map.address)
    })

    it('name()', async () => {
      expect(await zones.name()).to.eq('ETHMap Zones')
    })

    it('symbol()', async () => {
      expect(await zones.symbol()).to.eq('ZONES')
    })

    it('baseURI()', async () => {
      expect(await zones.baseURI()).to.eq(`https://ethmap.world/`)
    })

    it('baseTokenURI()', async () => {
      expect(await zones.baseTokenURI()).to.eq(`https://ethmap.world/`)
    })

    it('tokenURI()', async () => {
      expect(await zones.tokenURI(5)).to.eq(`https://ethmap.world/5`)
    })
  })

  describe('setBaseURI()', () => {
    it('Should revert if not owner', async () => {
      await expect(zones.connect(wallet1).setBaseURI('x'))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('Should update URI', async () => {
      await zones.setBaseURI('x/')
      expect(await zones.baseURI()).to.eq(`x/`)
      expect(await zones.baseTokenURI()).to.eq(`x/`)
      expect(await zones.tokenURI(5)).to.eq(`x/5`)
    })
  })

  describe('prepareToWrapZone()', () => {
    it('Should revert if caller does not own zone', async () => {
      await expect(zones.prepareToWrapZone(1))
        .to.be.revertedWith('ETHMapZones: caller is not zone owner.')
    })

    it('Should mark zone as prepared to wrap', async () => {
      await stealZone(1)
      await zones.prepareToWrapZone(1)
      expect(await zones.pendingZoneOwners(1)).to.eq(wallet.address)
    })

    it('Should change pending owner if new caller prepares zone', async () => {
      await stealZone(1)
      await zones.prepareToWrapZone(1)
      expect(await zones.pendingZoneOwners(1)).to.eq(wallet.address)
      await map.transferZone(1, wallet1.address)
      await zones.connect(wallet1).prepareToWrapZone(1)
      expect(await zones.pendingZoneOwners(1)).to.eq(wallet1.address)
    })
  })

  describe('canWrapZone()', async () => {
    it('Should be false if caller is not zone owner', async () => {
      expect(await zones.canWrapZone(1)).to.be.false
    })

    it('Should be false if caller has not prepared zone', async () => {
      await stealZone(1)
      expect(await zones.canWrapZone(1)).to.be.false
    })

    it('Should be false if caller has prepared zone but not transferred it', async () => {
      await stealZone(1)
      await zones.prepareToWrapZone(1)
      expect(await zones.canWrapZone(1)).to.be.false
    })

    it('Should be true if caller has prepared zone and transferred it to wrapper', async () => {
      await stealZone(1)
      await zones.prepareToWrapZone(1)
      await map.transferZone(1, zones.address)
      expect(await zones.canWrapZone(1)).to.be.true
    })
  })

  describe('wrapZone()', () => {
    it('Should revert if caller has not prepared zone', async () => {
      await expect(zones.wrapZone(1))
        .to.be.revertedWith('ETHMapZones: Zone not prepared for wrap.')
    })

    it('Should revert if caller has not transferred zone to wrapper', async () => {
      await stealZone(1)
      await zones.prepareToWrapZone(1)
      await expect(zones.wrapZone(1))
        .to.be.revertedWith('ETHMapZones: Contract has not received zone.')
    })

    it('Should mint token of same ID for caller and reset pendingZoneOwners', async () => {
      await stealZone(1)
      await zones.prepareToWrapZone(1)
      await map.transferZone(1, zones.address)
      await zones.wrapZone(1)
      expect(await zones.pendingZoneOwners(1)).to.eq(constants.AddressZero)
      expect(await zones.tokenByIndex(0)).to.eq(1)
      expect(await zones.tokenOfOwnerByIndex(wallet.address, 0)).to.eq(1)
      expect(await zones.ownerOf(1)).to.eq(wallet.address)
      expect(await zones.totalSupply()).to.eq(1)
    })
  })

  describe('unwrapZone()', () => {
    it('Should revert if token is not wrapped', async () => {
      await expect(zones.unwrapZone(1))
        .to.be.revertedWith("ERC721: operator query for nonexistent token")
    })

    it('Should revert if caller not owner or approved', async () => {
      await stealZone(1)
      await zones.prepareToWrapZone(1)
      await map.transferZone(1, zones.address)
      await zones.wrapZone(1)
      await zones.transferFrom(wallet.address, wallet1.address, 1)
      await expect(zones.unwrapZone(1)).to.be.revertedWith('ETHMapZones: caller is not owner nor approved.')
    })

    it('Should allow owner to unwrap', async () => {
      await stealZone(1)
      await zones.prepareToWrapZone(1)
      await map.transferZone(1, zones.address)
      await zones.wrapZone(1)
      await zones.unwrapZone(1)
      expect((await map.getZone(1)).owner).to.eq(wallet.address)
      expect(await zones.totalSupply()).to.eq(0)
    })

    it('Should allow approved to unwrap', async () => {
      await stealZone(1)
      await zones.prepareToWrapZone(1)
      await map.transferZone(1, zones.address)
      await zones.wrapZone(1)
      await zones.approve(wallet1.address, 1)
      await zones.connect(wallet1).unwrapZone(1)
      expect((await map.getZone(1)).owner).to.eq(wallet1.address)
      expect(await zones.totalSupply()).to.eq(0)
    })
  })

  describe('claimUnpreparedZone()', () => {
    it('Should revert if not called by owner', async () => {
      await expect(zones.connect(wallet1).claimUnpreparedZone(1))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('Should revert if zone is prepared', async () => {
      await stealZone(1)
      await zones.prepareToWrapZone(1)
      await expect(zones.claimUnpreparedZone(1))
        .to.be.revertedWith('ETHMapZones: Zone prepared for wrap.')
    })

    it('Should revert if zone has already been minted', async () => {
      await stealZone(1)
      await zones.prepareToWrapZone(1)
      await map.transferZone(1, zones.address)
      await zones.wrapZone(1)
      await expect(zones.claimUnpreparedZone(1))
        .to.be.revertedWith('ETHMapZones: Zone already wrapped.')
    })

    it('Should revert if zone not owned by contract', async () => {
      await stealZone(1)
      await expect(zones.claimUnpreparedZone(1))
        .to.be.revertedWith('ETHMapZones: Contract has not received zone.')
    })

    it('Should mint unprepared token for owner', async () => {
      await stealZone(1)
      await map.transferZone(1, zones.address)
      await zones.claimUnpreparedZone(1)
      expect(await zones.pendingZoneOwners(1)).to.eq(constants.AddressZero)
      expect(await zones.tokenByIndex(0)).to.eq(1)
      expect(await zones.tokenOfOwnerByIndex(wallet.address, 0)).to.eq(1)
      expect(await zones.ownerOf(1)).to.eq(wallet.address)
      expect(await zones.totalSupply()).to.eq(1)
    })
  })
})