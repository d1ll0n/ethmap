// SPDX-License-Identifier: MIT
pragma solidity >=0.4.0;
pragma abicoder v2;

import "./IEthMap.sol";


contract ZoneMap {
  IEthMap public constant map = IEthMap(0xB6bbf89c3DbBa20Cb4d5cABAa4A386ACbbAb455e);

  struct Zone {
    uint id;
    address owner;
    uint sellPrice;
  }

  function getAllZones() external view returns (Zone[] memory zones) {
    zones = new Zone[](178);
    for (uint256 i; i < 178; i++) {
      (uint id, address owner, uint sellPrice) = map.getZone(i);
      zones[i] = Zone(id, owner, sellPrice);
    }
  }

  function getZonesForSale() external view returns (Zone[] memory zones) {
    zones = new Zone[](178);
    uint256 n;
    for (uint256 i; i < 178; i++) {
      (uint id, address owner, uint sellPrice) = map.getZone(i + 1);
      if (sellPrice > 0) {
        zones[n++] = Zone(id, owner, sellPrice);
      }
    }
    assembly { mstore(zones, n) }
  }
}