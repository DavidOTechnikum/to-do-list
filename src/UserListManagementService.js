import Web3 from "web3";
import UserListManagement from "./contracts/UserListManagement.json";

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

// komplette Methode: Parameter anpassen (mein AES-Key)-
export async function createListBlockchain(
  id,
  ipnsName,
  myEncryptedAESKey,
  accountMetaMask
) {
  await userListManagementContract.methods
    .createList(id, ipnsName, myEncryptedAESKey) // hier auch-
    .send({ from: accountMetaMask });
}

// format for list array: { id: newList.id, key: serializedKeyPair }

export async function fetchUserListsBlockchain(accountMetaMask) {
  //geht nicht mehr so..
  // getUserLists: returnt ListKey-Array (ui, keyAES)
  // Loop: ...methods.iPNSname(id).call(); -> IPNS-Namen holen
  // pushen: ListObject = { id, ipnsName, AESKey} und return
  const listIds = await userListManagementContract.methods
    .fetchUserLists()
    .call({ from: accountMetaMask });
  const lists = [];

  for (let id of listIds) {
    const list = await userListManagementContract.methods.lists(id).call();
    //alert(`fetched list id: ${list.id} and ipnsName: ${list.ipnsName}`);
    const newListObject = { id: list.id, key: list.ipnsName };
    lists.push(newListObject);
  }
  return lists; // Format bzw. Objekt überprüfen!
}

export async function fetchListPeersBlockchain(accountMetaMask) {
  // Parameter: ListenID
  // Return: Adressen-Array (Strings)
}

export async function deleteListBlockchain(id, accountMetaMask) {
  try {
    await userListManagementContract.methods
      .deleteList(id)
      .send({ from: accountMetaMask });
  } catch (error) {
    return error;
  }
}

export async function shareListBlockchain() {
  // Parameter: Peer-Adresse, ListenID, verschlüsselten AES-Key
  // shareList() aufrufen: peer, id, keyAES
  // retval: bool
}

export async function unshareListBlockchain() {
  // Parameter: Peer-Adresse, ListenID
  // unshareList() aufrufen
  // retval: bool
}

export async function storeRSAPubKeyBlockchain(rSAPubKey, accountMetaMask) {
  try {
    alert(`storing from account ${accountMetaMask}`);
    alert(`pubkey: ${rSAPubKey}`);
    await userListManagementContract.methods
      .storeRSAPubKey(rSAPubKey)
      .send({ from: accountMetaMask });
  } catch (error) {
    return error;
  }
}

export async function getRSAPubKeyBlockchain(peerAccount) {
  try {
    const peerRSAPubKey = await userListManagementContract.methods
      .userRSAPubKeys(peerAccount)
      .call();
    return peerRSAPubKey;
  } catch (error) {
    return error;
  }
}
