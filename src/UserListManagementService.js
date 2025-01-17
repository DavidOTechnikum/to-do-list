import Web3 from "web3";
import UserListManagement from "./contracts/UserListManagement.json";

const web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:7545");

let userListManagementContract;
let userAccount;

export async function loadBlockchainData(accountMetaMask) {
  const accounts = await web3.eth.requestAccounts();
  userAccount = accounts(0);
  //userAccount = accountMetaMask;

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

export async function createListBlockchain(id, ipnsName, accountMetaMask) {
  await userListManagementContract.methods
    .createList(id, ipnsName)
    .send({ from: accountMetaMask });
}

export async function fetchUserListsBlockchain(accountMetaMask) {
  const listIds = await userListManagementContract.methods
    .fetchUserLists({ from: accountMetaMask })
    .call();
  const lists = [];
  for (let id of listIds) {
    const list = await userListManagementContract.methods.lists(id).call();
    lists.push(list);
  }
  return lists;
}

export async function deleteListBlockchain(id, accountMetaMask) {
  await userListManagementContract.methods
    .deleteList(id)
    .send({ from: accountMetaMask });
}
