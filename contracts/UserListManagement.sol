// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract UserListManagement {

  struct List {
    uint id;
    string ipnsName;
    address creator;
  }

  // user address to list IDs
  mapping(address => uint[]) public userLists;
  // list ID to list data
  mapping(uint => List) public lists;

  event ListCreated(uint id, string ipnsName, address creator);
  event ListDeleted(uint id);


  function createList(uint _id, string memory _ipnsName) public {
    require(lists[_id].creator == address(0), "List ID already exists.");

    lists[_id] = List(_id, _ipnsName, msg.sender);
    userLists[msg.sender].push(_id);
    emit ListCreated(_id, _ipnsName, msg.sender);
  }

  function fetchUserLists() public view returns (uint[] memory) {
    return userLists[msg.sender];
  }

  function deleteList(uint _id) public {
    require(lists[_id].creator == msg.sender, "Only the creator can destroy.");
    delete lists[_id];

    uint[] storage userList = userLists[msg.sender];
    for (uint i = 0; i < userList.length; i++) {
      if (userList[i] == _id) {
        userList[i] = userList[userList.length -1];
        userList.pop();
        break;
      }
    }
    emit ListDeleted(_id);
  }
  
}
