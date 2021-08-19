// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./OpenSeaWhitelistERC721.sol";
import "./IEthMap.sol";


contract ETHMapZones is OpenSeaWhitelistERC721("ETH Map Zones", "ZONES"), Ownable() {
/** ==========  Constants  ========== */

  IEthMap public constant map = IEthMap(0xB6bbf89c3DbBa20Cb4d5cABAa4A386ACbbAb455e);

/** ==========  Storage  ========== */

  mapping(uint256 => address) public pendingZoneOwners;

/** ==========  Queries  ========== */

  function baseTokenURI() public pure virtual returns (string memory) {
    return "https://ethmap.zone/";
  }

  function baseURI() public view virtual override returns (string memory) {
    return baseTokenURI();
  }

  function tokenURI(uint256 _tokenId) public pure virtual override returns (string memory) {
    return string(abi.encodePacked(baseTokenURI(), Strings.toString(_tokenId)));
  }

  function canWrapZone(uint256 id) public view returns (bool) {
    return pendingZoneOwners[id] == msg.sender && zoneOwner(id) == address(this);
  }

  function zoneOwner(uint256 zoneId) internal view returns (address owner) {
    (,owner,) = map.getZone(zoneId);
  }

/** ==========  Actions  ========== */

  function prepareToWrapZone(uint256 zoneId) external {
    require(zoneOwner(zoneId) == msg.sender, "ETHMapZones: caller is not zone owner.");
    pendingZoneOwners[zoneId] = msg.sender;
  }

  function wrapZone(uint256 zoneId) external {
    require(pendingZoneOwners[zoneId] == msg.sender, "ETHMapZones: Zone not prepared for wrap.");
    require(zoneOwner(zoneId) == address(this), "ETHMapZones: Contract has not received zone.");
    pendingZoneOwners[zoneId] = address(0);
    _mint(msg.sender, zoneId);
  }

  function unwrapZone(uint256 zoneId) external {
    require(_isApprovedOrOwner(_msgSender(), zoneId), "ETHMapZones: caller is not owner nor approved.");
    _burn(zoneId);
    map.transferZone(zoneId, _msgSender());
  }
}