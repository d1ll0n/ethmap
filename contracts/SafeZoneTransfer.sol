// SPDX-License-Identifier: MIT
pragma solidity >=0.4.0;
pragma abicoder v2;

import "./IEthMap.sol";


abstract contract SafeZoneTransfer {
  IEthMap public constant map = IEthMap(0xB6bbf89c3DbBa20Cb4d5cABAa4A386ACbbAb455e);

  mapping(uint256 => address) public pendingZoneOwners;

  function canWrapZone(uint256 id) public view returns (bool) {
    return pendingZoneOwners[id] == msg.sender && zoneOwner(id) == address(this);
  }

  function zoneOwner(uint256 id) internal view returns (address owner) {
    (,owner,) = map.getZone(id);
  }

  function doesCallerOwnZone(uint256 id) internal view returns (bool) {
    return msg.sender == zoneOwner(id);
  }

  function prepareWrapZone(uint256 id) external {
    require(doesCallerOwnZone(id), "Not zone owner");
    pendingZoneOwners[id] = msg.sender;
  }

  function wrapZone(uint256 id) external {
    require(pendingZoneOwners[id] == msg.sender, "Zone not prepared for wrap");
    require(zoneOwner(id) == address(this), "Contract has not received zone.");
  }
}