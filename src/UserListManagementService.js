//import Web3 from "web3";
import { ethers } from "ethers";
import UserListManagement from "./contracts/UserListManagement.json";

let provider;
let signer;
let userListManagementContract;

export async function loadBlockchainData(accountMetaMask) {
  // Use MetaMask's provider
  if (window.ethereum == null) {
    alert(`MetaMask not installed`);
    provider = ethers.getDefaultProvider();
  } else {
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner(); // Get the signer (current account)
  }

  const network = await provider.getNetwork();
  const networkId = network.chainId; // Convert BigInt to number
  const networkData = UserListManagement.networks[networkId];

  if (networkData) {
    userListManagementContract = new ethers.Contract(
      networkData.address,
      UserListManagement.abi,
      signer // Connect the contract to the signer (to send transactions)
    );
    return true;
  } else {
    alert("Smart contract not deployed to detected network.");
    return false;
  }
}

/*
//const web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:7545");
const web3 = new Web3(window.ethereum);

let userListManagementContract;
let userAccount;

export async function loadBlockchainData(accountMetaMask) {
  // const accounts = await web3.eth.requestAccounts();
  //userAccount = accounts[0];
  userAccount = accountMetaMask;

  const networkId = await web3.eth.net.getId();
  const networkData = UserListManagement.networks[networkId];

  if (networkData) {
    userListManagementContract = new web3.eth.Contract(
      UserListManagement.abi,
      networkData.address
    );
    return true;
  } else {
    alert("Smart contract not deployed to detected network.");
    return false;
  }
}
*/

// komplette Methode: Parameter anpassen (mein AES-Key)-
export async function createListBlockchain(id, ipnsName, myEncryptedAESKey) {
  alert(`now calling: ${id}, ${ipnsName}, ${myEncryptedAESKey}`);
  //const tx = await userListManagementContract.methods.createList(id, ipnsName, myEncryptedAESKey).send({ from: accountMetaMask });
  try {
    const tx = await userListManagementContract.createList(
      id,
      ipnsName,
      myEncryptedAESKey
    );
    const receipt = await tx.wait();
    alert(`Transaction confirmed: ${receipt.blockNumber}`);
  } catch (error) {
    alert(`Error creating list: ${error}`);
  }
}
// format for list array: { id: newList.id, key: serializedKeyPair }

export async function fetchUserListsBlockchain(accountMetaMask) {
  // getUserLists: returnt ListKey-Array (ui, keyAES)-
  //const myEncryptedAESKeys = await userListManagementContract.methods.getUserLists(accountMetaMask).call({ from: accountMetaMask });
  let myEncryptedAESKeys;
  try {
    myEncryptedAESKeys = await userListManagementContract.getUserLists(
      accountMetaMask
    );
  } catch (error) {
    return Error(`BC fetching failed, error: ${error}`);
  }

  // Loop: ...methods.iPNSname(id).call(); -> IPNS-Namen holen
  const returnListData = await Promise.all(
    myEncryptedAESKeys.map(async (object) => {
      //const iPNSname = await userListManagementContract.methods.iPNSname(object.id).call();
      let iPNSname;
      try {
        iPNSname = await userListManagementContract.iPNSname(object.id);
      } catch (error) {
        return error;
      }
      const newReturnDataObject = {
        id: object.id,
        iPNSname: iPNSname,
        encryptedAESKey: object.keyAES
      };
      return newReturnDataObject;
    })
  );
  // pushen: ListObject = { id, ipnsName, AESKey} und return
  returnListData.map((object) => {
    //alert(`returndata: ${object.id}, ${object.iPNSname}, ${object.encryptedAESKey}`);
  });
  return returnListData; // Format bzw. Objekt überprüfen!
}

export async function fetchListPeersBlockchain(id) {
  // Parameter: ListenID-
  alert(`here`);
  try {
    const peers = await userListManagementContract.getListUsers(id);
    return peers;
  } catch (error) {
    return error;
  }
  //const peers = await userListManagementContract.methods.getListUsers(id).call();
  // Return: Adressen-Array (Strings oder anderes Format?)                    ------- !
}

export async function deleteListBlockchain(id) {
  try {
    //await userListManagementContract.methods.deleteList(id).send({ from: accountMetaMask });
    const tx = await userListManagementContract.deleteList(id);
    const receipt = await tx.wait();
    alert(`transaction confirmed: ${receipt.blockNumber}`);
  } catch (error) {
    return error;
  }
}

export async function shareListBlockchain(peer, id, peerEncryptedAESKeyString) {
  // Parameter: Peer-Adresse, ListenID, verschlüsselten AES-Key-
  // shareList() aufrufen: peer, id, keyAES-
  try {
    //await userListManagementContract.methods.shareList(peer, id, peerEncryptedAESKeyString).send({ from: accountMetaMask });
    const tx = await userListManagementContract.shareList(
      peer,
      id,
      peerEncryptedAESKeyString
    );
    const receipt = await tx.wait();
    alert(`transaction confirmed: ${receipt.blockNumber}`);
  } catch (error) {
    return error;
  }
}

export async function unshareListBlockchain(peer, id) {
  // Parameter: Peer-Adresse, ListenID-
  // unshareList() aufrufen
  try {
    //await userListManagementContract.methods.unshareList(peer, id).send({ from: accountMetaMask });
    const tx = await userListManagementContract.unsahreList(peer, id);
    const receipt = await tx.wait();
    alert(`transaction confirmed: ${receipt.blockNumber}`);
  } catch (error) {
    return error;
  }
}

export async function storeRSAPubKeyBlockchain(rSAPubKey, accountMetaMask) {
  try {
    alert(`storing from account ${accountMetaMask}`);
    alert(`pubkey: ${rSAPubKey}`);
    //await userListManagementContract.methods.storeRSAPubKey(rSAPubKey).send({ from: accountMetaMask });
    const tx = await userListManagementContract.storeRSAPubKey(rSAPubKey);
    const receipt = await tx.wait();
    alert(`transaction confirmed: ${receipt.blockNumber}`);
  } catch (error) {
    return error;
  }
}

export async function getRSAPubKeyBlockchain(peerAccount) {
  try {
    //const peerRSAPubKey = await userListManagementContract.methods.userRSAPubKeys(peerAccount).call();
    const peerRSAPubKey = await userListManagementContract.userRSAPubKeys(
      peerAccount
    );
    return peerRSAPubKey;
  } catch (error) {
    return error;
  }
}
