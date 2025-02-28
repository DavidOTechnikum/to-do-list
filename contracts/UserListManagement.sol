// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract UserListManagement {

 // struct List {
 //   uint id;
 //   string ipnsName;
 //   address creator;
 // }

  struct ListKey {
    uint id;
    string keyAES;
  }


// how to secure data in mappings? 
  // user address to list IDs
  mapping(address => ListKey[]) public userLists;
  // list ID to list data
  mapping(uint => address[]) public listUsers;

  mapping(uint => string) public iPNSname;

  mapping(address => string) public userRSAPubKeys;

  event ListCreated(uint id, string ipnsName, address creator);
  event ListDeleted(uint id);
  event RSAPubKeyStored(string RSAPubKey);
  event ListShared(uint id, address peer);
  event ListUnshared(uint id, address peer);

  // Getter für das komplette Array                                               -------------!


  function createList(uint _id, string memory _ipnsName, string memory _keyAES) public {
    // Check in mapping: Creator of said list must be 0 i.e. list does not exist yet.  ------> anders machen 
   // require(listUsers[_id][0] == address(0), "List ID already exists.");

    iPNSname[_id] = (_ipnsName);
    userLists[msg.sender].push(ListKey(_id, _keyAES));
    listUsers[_id].push(msg.sender);
    
    emit ListCreated(_id, _ipnsName, msg.sender);
  }

//  function fetchUserLists() public view returns (uint[] memory) {
//    return userLists[msg.sender];
//  }

function userCheck(address myAddress, uint _id) private view returns (bool) {
  for (uint i = 0; i < listUsers[_id].length; i++) {
    if (listUsers[_id][i] == myAddress) {
      return true;
    }
  } 
  return false;
}


  function shareList(address peer, uint _id, string memory _keyAES) public {
    require(userCheck(msg.sender, _id), "No rights to the list");
    require(peer != msg.sender, "Sharing with oneself not possible");
    //    schauen, ob "peer" tatsächlich eine Adresse ist -> openzeppelin     -----!
    
    userLists[peer].push(ListKey(_id, _keyAES));
    listUsers[_id].push(peer);

    emit ListShared(_id, peer);
  }

  function unshareList(address peer, uint _id) public {
    require(userCheck(msg.sender, _id), "No rights to the list");
    // require: nicht letzer User                                           -----!

    for (uint i = 0; i < listUsers[_id].length; i++) {
      if (listUsers[_id][i] == peer) {
        listUsers[_id][i] = listUsers[_id][listUsers[_id].length -1];
        listUsers[_id].pop();
      }
    }

    for (uint i = 0; i < userLists[peer].length; i++) {
      if (userLists[peer][i].id == _id) {
        userLists[peer][i] = userLists[peer][userLists[peer].length -1];
        userLists[peer].pop();
      }
    }

    emit ListUnshared(_id, peer);
  }



  function deleteList(uint _id) public {
    require(userCheck(msg.sender, _id), "No rights to the list");
    
    for (uint i = 0; i < listUsers[_id].length; i++) {
      address tempUser = listUsers[_id][i];
      for (uint j = 0; j < userLists[tempUser].length; j++) {
        if (userLists[tempUser][j].id == _id) {
          userLists[tempUser][j] = userLists[tempUser][userLists[tempUser].length -1];
          userLists[tempUser].pop();
        }
      }
    }

    delete listUsers[_id];
    delete iPNSname[_id];

    emit ListDeleted(_id);
  }



  function storeRSAPubKey(string memory _rSAPubKey) public {
        require(bytes(_rSAPubKey).length > 0, "Public key cannot be empty");
        userRSAPubKeys[msg.sender] = _rSAPubKey;  // Store key
        emit RSAPubKeyStored(_rSAPubKey);
  }
  
}
