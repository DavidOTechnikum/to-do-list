// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract UserListManagement {

  struct List {
    uint id;
    string ipnsName;
    address creator;
  }


// how to secure data in mappings? 
  // user address to list IDs
  mapping(address => uint[]) public userLists;
  // list ID to list data
  mapping(uint => List) public lists;
  // username and RSA pubkey feature 
  mapping(address => string) public userRSAPubKeys;

  event ListCreated(uint id, string ipnsName, address creator);
  event ListDeleted(uint id);
  event RSAPubKeyStored(string RSAPubKey);


  function createList(uint _id, string memory _ipnsName) public {
    // Check in mapping: Creator of said list must be 0 i.e. list does not exist yet. 
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
    uint length = userList.length;
    for (uint i = 0; i < length; i++) {
      if (userList[i] == _id) {
        userList[i] = userList[userList.length -1];
        userList.pop();
        break;
      }
    }
    emit ListDeleted(_id);
  }



  function storeRSAPubKey(string memory _rSAPubKey) public {
        require(bytes(_rSAPubKey).length > 0, "Public key cannot be empty");
        userRSAPubKeys[msg.sender] = _rSAPubKey;  // Store key
        emit RSAPubKeyStored(_rSAPubKey);
  }
  
}
