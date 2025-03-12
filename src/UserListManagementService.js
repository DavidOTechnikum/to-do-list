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
  alert(`now calling: ${id}, ${ipnsName}, ${myEncryptedAESKey}`);
  const tx = await userListManagementContract.methods
    .createList(id, ipnsName, myEncryptedAESKey)
    .send({ from: accountMetaMask });
  alert(`log: ${tx.transactionHash}`);
}
// format for list array: { id: newList.id, key: serializedKeyPair }

export async function fetchUserListsBlockchain(accountMetaMask) {
  //geht nicht mehr so..
  // getUserLists: returnt ListKey-Array (ui, keyAES)-
  const myEncryptedAESKeys = await userListManagementContract.methods
    .getUserLists(accountMetaMask)
    .call({ from: accountMetaMask });
  // Loop: ...methods.iPNSname(id).call(); -> IPNS-Namen holen
  const returnListData = [];
  myEncryptedAESKeys.map(async (object) => {
    const iPNSname = await userListManagementContract.methods
      .iPNSname(object.id)
      .call();
    const newReturnDataObject = {
      id: object.id,
      iPNSname: iPNSname,
      encryptedAESKey: object.keyAES
    };
    returnListData.push(newReturnDataObject);
  });

  // pushen: ListObject = { id, ipnsName, AESKey} und return
  return returnListData; // Format bzw. Objekt überprüfen!
}

export async function fetchListPeersBlockchain(id) {
  // Parameter: ListenID-
  const peers = await userListManagementContract.methods
    .getListUsers(id)
    .call();
  // Return: Adressen-Array (Strings oder anderes Format?)                    ------- !
  return peers;
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

export async function shareListBlockchain(
  peer,
  id,
  peerEncryptedAESKeyString,
  accountMetaMask
) {
  // Parameter: Peer-Adresse, ListenID, verschlüsselten AES-Key-
  // shareList() aufrufen: peer, id, keyAES-
  try {
    await userListManagementContract.methods
      .shareList(peer, id, peerEncryptedAESKeyString)
      .send({ from: accountMetaMask });
  } catch (error) {
    return error;
  }
}

export async function unshareListBlockchain(peer, id, accountMetaMask) {
  // Parameter: Peer-Adresse, ListenID-
  // unshareList() aufrufen
  try {
    await userListManagementContract.methods
      .unshareList(peer, id)
      .send({ from: accountMetaMask });
  } catch (error) {
    return error;
  }
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
