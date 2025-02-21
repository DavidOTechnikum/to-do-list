import React, { useState, useEffect } from "react";
import TodoList from "./TodoList";
import AddForm from "./AddForm";
import { uploadToPinata, fetchFromPinata, unpinFromPinata } from "./pinata";
import { saveToLocalStorage, loadFromLocalStorage } from "./storage";
import "./App.css";
import KeyManager from "./keyManager";
import {
  deserializeKeys,
  newPublishToIpns,
  republishToIpns,
  resolveFromIpns
} from "./ipns";
import {
  loadBlockchainData,
  createListBlockchain,
  fetchUserListsBlockchain,
  deleteListBlockchain,
  getListIpnsName
} from "./UserListManagementService";
import { flushSync } from "react-dom";

const App = () => {
  // for MetaMask:
  const [loadingMetaMask, setLoadingMetaMask] = useState(true);
  const [accountMetaMask, setAccountMetaMask] = useState(null);
  useEffect(() => {
    const checkMetaMaskConnection = async () => {
      if (window.ethereum) {
        try {
          // Request account access if necessasry
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts"
          });

          if (accounts.length > 0) {
            setAccountMetaMask(accounts[0]);
          }
        } catch (error) {
          alert("MetaMask login error", error);
        }
      } else {
        alert("MetaMask not installed");
      }
      setLoadingMetaMask(false);
    };
    checkMetaMaskConnection();
  }, []);

  // for Smart Contract:
  const [isBlockchainLoaded, setBlockchainLoaded] = useState(false);
  useEffect(() => {
    const initializeBlockchain = async () => {
      const success = await loadBlockchainData(accountMetaMask);
      setBlockchainLoaded(success);
    };
    initializeBlockchain();
  }, []);

  // for Lists:
  const [lists, setLists] = useState([]); // memory for rendering right now
  const [deserKeys, setDeserKeys] = useState([]);
  const [ipnsKeys, setIpnsKeys] = useState([]);

  /*
  const [ipnsKeys, setIpnsKeys] = useState(
    () => JSON.parse(localStorage.getItem("ipnsKeys")) || []
  );
  useEffect(() => {
    localStorage.setItem("ipnsKeys", JSON.stringify(ipnsKeys));
  }, [ipnsKeys]);
  */
  /*
  const [hashes, setHashes] = useState(
    () => JSON.parse(localStorage.getItem("todoHashes")) || []
  );

  useEffect(() => {
    localStorage.setItem("todoHashes", JSON.stringify(hashes));
  }, [hashes]);
*/

  const addList = async (title) => {
    const newList = { id: Date.now(), title, tasks: [] };
    setLists((prev) => [...prev, newList]);
    const cid = await uploadToPinata(newList);
    const serializedKeyPair = await newPublishToIpns(cid);

    // storing to ipnsKeys necessary for uploadList()
    setIpnsKeys((prev) => [
      ...prev,
      { id: newList.id, key: serializedKeyPair }
    ]);
    await createListBlockchain(newList.id, serializedKeyPair, accountMetaMask);
  };

  /*
  const uploadList = async (list) => {
    try {
      const cid = await uploadToPinata(list);
      setHashes((prev) => [...prev, { id: list.id, cid }]);
      alert(`List uploaded to IPFS! CID: ${cid}`);
    } catch (error) {
      alert("Failed to upload list to IPFS.");
    }
    return cid;
  };
*/

  const uploadList = async (list) => {
    const cid = await uploadToPinata(list);
    ipnsKeys.map((l) => {
      if (l.id === list.id) {
        republishToIpns(l.key, cid);
      }
    });
  };

  const fetchLists = async () => {
    clearLists();

    const fetchedLists = fetchUserListsBlockchain(accountMetaMask);

    (await fetchedLists).map(async (fl) => {
      setIpnsKeys((prev) => [...prev, fl]);
    });

    ipnsKeys.map(async (l) => {
      const keyPair = await deserializeKeys(l.key);
      setDeserKeys((prev) => [...prev, keyPair.publicKey]);
    });

    deserKeys.map(async (l) => {
      const result = await resolveFromIpns(l);
      const list = await fetchFromPinata(result.cid);
      setLists((prev) => [...prev, list]);
    });

    /*
    ipnsKeys.map(async (l) => {
      const keyPair = await deserializeKeys(l.key);
      alert(`fetchlist keydeser: ${keyPair.publicKey}`);
      const result = await resolveFromIpns(keyPair.publicKey);
      const list = await fetchFromPinata(result.cid);
      setLists((prev) => [...prev, list]);
    });
*/
  };

  const deleteList = async (deletedList) => {
    // Löschen im Smart Contract
    // unpinnen im Pinata
    // löschen aus Liste-Mapping und ipnsKeys-Mapping

    ipnsKeys.map(async (l) => {
      if (l.id == deletedList.id) {
        const keyPair = await deserializeKeys(l.key);
        const cid = resolveFromIpns(keyPair.publicKey);
        await unpinFromPinata(cid);
      }
    });

    try {
      await deleteListBlockchain(deletedList.id, accountMetaMask);
      alert(`deletion from blockchain complete`);
    } catch (error) {
      alert(`deletion from blockchain unsuccessful`);
      return;
    }

    setLists((l) => l.filter((item) => item.id !== deletedList.id));
    setIpnsKeys((k) => k.filter((item) => item.id !== deletedList.id));
  };

  const clearLists = () => {
    const resetList = [];
    const resetDeserList = [];
    const resetIpnsKeys = [];
    setLists(resetList);
    setDeserKeys(resetDeserList);
    setIpnsKeys(resetIpnsKeys);
  };

  const updateList = (updatedList) => {
    const updatedLists = lists.map((list) =>
      list.id === updatedList.id ? updatedList : list
    );
    setLists(updatedLists);
    // uploadList(updatedList); // Re-upload the updated list to Pinata
  };

  if (loadingMetaMask) {
    return <div>Loading MetaMask...</div>;
  }

  if (!accountMetaMask) {
    return (
      <div>
        <h2>MetaMask is not connected. Please log in/install.</h2>
      </div>
    );
  }

  if (!isBlockchainLoaded) {
    return <div>Loading Blockchain...</div>;
  }

  return (
    <div>
      <AddForm placeholder="Add new list" onSubmit={addList} />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          marginTop: "16px"
        }}
      >
        {lists.map((list) => (
          <TodoList
            key={list.id}
            list={list}
            updateList={updateList}
            uploadList={uploadList}
            deleteList={deleteList}
          />
        ))}
      </div>
      <div>
        <button onClick={fetchLists}>Fetch all Lists</button>
        <button onClick={clearLists}>Clear Screen (debug) </button>
      </div>
      <div>
        <KeyManager accountMetaMask={accountMetaMask} />
      </div>
    </div>
  );
};

export default App;
