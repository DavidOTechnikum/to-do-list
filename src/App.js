import React, { useState, useEffect } from "react";
import TodoList from "./TodoList";
import AddForm from "./AddForm";
import { uploadToPinata, fetchFromPinata, unpinFromPinata } from "./pinata";
import { generateKeyPair } from "@libp2p/crypto/keys";
import { saveToLocalStorage, loadFromLocalStorage } from "./storage";
import "./App.css";
import RSAEncryption from "./RSAEncryption";
import {
  deserializeKeys,
  newPublishToIpns,
  republishToIpns,
  resolveFromIpns,
  serializeKeys
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
  const [deserKeys, setDeserKeys] = useState([]); // kein useState! normales Array
  const [ipnsKeys, setIpnsKeys] = useState([]); // hier auch
  // notwendige Variable: RSA-Keypair (aus RSAEncryption.js)
  // notwendige Arrays: AESKeys (mit ListID),
  // neues useState: [ListID + Peer-Adressen]

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
    const keyPair = await generateKeyPair("Ed25519"); // Namen hier im Block verbessern: key pair wird bei IPNS genutzt
    const serializedKeyPair = serializeKeys(keyPair);
    const newList = { id: Date.now(), title, tasks: [] };
    // AES-Key erstellen (-> Array mit [id + aes key])
    // AES-Key mit eigenem RSA-Pubkey verschlüsseln - RSA-Encrypt
    try {
      await createListBlockchain(
        // Parameter anpassen: verschlüsselten AESKey inkludieren
        newList.id,
        serializedKeyPair,
        accountMetaMask
      );
    } catch (error) {
      return;
    }

    setLists((prev) => [...prev, newList]);
    const cid = await uploadToPinata(newList); // AES-Key mitgeben und dann in der Funktion alles verschlüsseln und hochladen
    await newPublishToIpns(cid, keyPair);

    // storing to ipnsKeys necessary for uploadList()
    setIpnsKeys((prev) => [
      ...prev,
      { id: newList.id, key: serializedKeyPair }
    ]);
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
    const cid = await uploadToPinata(list); // AES-Key hier auch mitgeben für Verschlüsselung des Contents
    alert(`uploading: pinata done`);
    ipnsKeys.map((l) => {
      if (l.id == list.id) {
        republishToIpns(l.key, cid);
      }
    });
  };

  const fetchLists = async () => {
    clearLists();

    const fetchedLists = fetchUserListsBlockchain(accountMetaMask); // hier Blockchain-Anbindung neu machen,
    // hier kommen dann auch die verschlüsselten AES-Keys mit (LisObject: {id, ipnsName, AESKey})
    // AES-Keys entschlüsseln und -> Array (list id + aes key )
    // restliche ListenInfo (id, ipnsName) kommt in ipns-Array
    // Loop: fetchListPeersBlockchain(id) -> return-Array kommt in Peer-UseState
    // folgende Zeilen dann anpassen bzw. löschen:

    (await fetchedLists).map(async (fl) => {
      // anpassen auf Array
      setIpnsKeys((prev) => [...prev, fl]);
    });

    ipnsKeys.map(async (l) => {
      // anpassen auf Array
      const keyPair = await deserializeKeys(l.key);
      setDeserKeys((prev) => [...prev, keyPair.publicKey]);
    });

    deserKeys.map(async (l) => {
      const result = await resolveFromIpns(l);
      const list = await fetchFromPinata(result.cid); // Parameter: AES-Key
      // (in der fetchFromPinata() erfolgt die Entschlüsselung der Listen, JSON parsen)
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
    // löschen aus Liste-Mapping und ipnsKeys-Array, AES-Key-Array, Peer-UseState

    try {
      await deleteListBlockchain(deletedList.id, accountMetaMask);
      alert(`deletion from blockchain complete`);
    } catch (error) {
      alert(`deletion from blockchain unsuccessful`);
      return;
    }

    ipnsKeys.map(async (l) => {
      // alles auf Array
      if (l.id == deletedList.id) {
        const keyPair = await deserializeKeys(l.key);
        const cid = resolveFromIpns(keyPair.publicKey);
        await unpinFromPinata(cid);
      }
    });

    setLists((l) => l.filter((item) => item.id !== deletedList.id));
    setIpnsKeys((k) => k.filter((item) => item.id !== deletedList.id));
    // AES-Key lokal rauslöschen
    // Peer-UseState löschen
  };

  const clearLists = () => {
    // Arrays austauschen, AES-Keys, Peer-UseState auch einbauen
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

  const shareList = () => {
    // (GUI-Input-Feld:) Peer-Adresse, Button-Click: Adresse & ListenID
    // Blockchain-Funktion: Peer-RSA-Pubkey holen, AES-Key verschlüsseln, Share-Funktion aufrufen
    // retval checken (bool?)
    // Peer-Adresse mit ListenID in useState
  };

  const unShareList = () => {
    // (GUI-Button:) Peer-Adresse - Button-Click: Adresse & ListenID
    // Blockchain-Funktion: ruft SC auf -
    //                      ...Test auf requires (z.B. unshare mit mir selbst als letztem User), sonst return und retval prüfen
    //                      ...macht: SC-Funktion aufrufen, User löschen etc.
    // falls geklappt: Peer-Adressenobjekt aus useState löschen
    // (Synchronisation mit Peer -> unlösbar? bleibt in seinem Programm bis er neu fetcht) loose end!
    // if: unshare mit mir selbst -> Listendaten aus useStates und Arrays entfernen
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

  // GUI anpassen:
  // TodoList: shareList(), unshareList(), Peer-Adressen-UseState mitgeben
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
      <br></br>
      <div>
        <button onClick={fetchLists}>Fetch all Lists</button>
        <button onClick={clearLists}>Clear Screen (debug) </button>
      </div>
      <br></br>
      <div>
        <RSAEncryption accountMetaMask={accountMetaMask} />
      </div>
    </div>
  );
};

export default App;
