import React, { useState, useEffect, useRef } from "react";
import TodoList from "./TodoList";
import AddForm from "./AddForm";
import { uploadToPinata, fetchFromPinata, unpinFromPinata } from "./pinata";
import { generateKeyPair } from "@libp2p/crypto/keys";
import { saveToLocalStorage, loadFromLocalStorage } from "./storage";
import "./App.css";
import RSAKeyHandling, { decryptRSA } from "./RSAEncryption";
import { encryptRSA, importRSAPublicKey } from "./RSAEncryption";
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
  getListIpnsName,
  fetchListPeersBlockchain,
  getRSAPubKeyBlockchain,
  shareListBlockchain,
  unshareListBlockchain
} from "./UserListManagementService";
import { flushSync } from "react-dom";
import { createAESKey, encryptAES } from "./AESEncryption";

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
  const [lists, setLists] = useState([]); // memory for rendering right now                         ------------ Arrays and Variables
  //const [deserKeys, setDeserKeys] = useState([]); // kein useState! normales Array-
  const deserKeys = useRef([]);
  //const [ipnsKeys, setIpnsKeys] = useState([]); // hier auch-
  const ipnsKeys = useRef([]);
  // notwendige Variable: RSA-Keypair (aus RSAEncryption.js)-
  // notwendige Arrays: AESKeys (mit ListID),-
  // neues useState: [ListID + Peer-Adressen]-
  const rSAKeyPair = useRef();
  const aESKeys = useRef([]);
  const [peerAddresses, setPeerAddresses] = useState([]);

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
    const iPNSKeyPair = await generateKeyPair("Ed25519"); // Namen hier im Block verbessern: key pair wird bei IPNS genutzt-
    const serializedIPNSKeyPair = serializeKeys(iPNSKeyPair);
    const newList = { id: Date.now(), title, tasks: [] };
    deserKeys.current.push({ id: newList.id, key: iPNSKeyPair.publicKey });
    // AES-Key erstellen (-> Array mit [id + aes key])-
    alert(`starting aes key gen`);
    const aESKey = await createAESKey();
    aESKeys.current.push({ id: newList.id, aESKey: aESKey });
    alert(`rsa key: ${rSAKeyPair.current.publicKey}`);
    // AES-Key mit eigenem RSA-Pubkey verschlüsseln - RSA-Encrypt-
    const encryptedAESKey = await encryptRSA(
      aESKey,
      rSAKeyPair.current.publicKey
    );
    try {
      await createListBlockchain(
        // Parameter anpassen: verschlüsselten AESKey inkludieren-
        newList.id,
        serializedIPNSKeyPair,
        encryptedAESKey
      );
    } catch (error) {
      return;
    }

    setLists((prev) => [...prev, newList]);
    const cid = await uploadToPinata(newList, aESKey); // AES-Key mitgeben und dann in der Funktion alles verschlüsseln und hochladen-
    await newPublishToIpns(cid, iPNSKeyPair);

    // storing to ipnsKeys necessary for uploadList()-
    ipnsKeys.current.push({ id: newList.id, key: serializedIPNSKeyPair });
    setPeerAddresses((prev) => [
      ...prev,
      { id: newList.id, peer: accountMetaMask }
    ]); // -> Datentyp?
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
    const aESKey = aESKeys.current.find(
      (keyObj) => keyObj.id === list.id
    ).aESKey;

    const cid = await uploadToPinata(list, aESKey); // AES-Key hier auch mitgeben für Verschlüsselung des Contents-
    ipnsKeys.current.map((l) => {
      if (l.id == list.id) {
        republishToIpns(l.key, cid);
      }
    });
  };

  const fetchLists = async () => {
    clearLists();
    if (rSAKeyPair.current == null) {
      alert(`no RSA Key set`);
      return;
    }

    const fetchedLists = await fetchUserListsBlockchain(accountMetaMask); // hier Blockchain-Anbindung neu machen -> retval: Array mit
    // Objekten: {id: int, iPNSname: String, encryptedAESKey: String}-
    // AES-Keys entschlüsseln und -> Array (list id + aes key )-
    await Promise.all(
      (
        await fetchedLists
      ).map(async (fl) => {
        let aESKey;
        try {
          aESKey = await decryptRSA(
            fl.encryptedAESKey,
            rSAKeyPair.current.privateKey
          );
        } catch (error) {
          alert(`list: ${fl.id} id: decryption error: ${error}`);
        }

        aESKeys.current.push({ id: Number(fl.id), aESKey: aESKey });
        ipnsKeys.current.push({ id: Number(fl.id), key: fl.iPNSname });
      })
    );

    // Loop: fetchListPeersBlockchain(id) -> return-Array kommt in Peer-UseState-
    /*
    await Promise.all(
      fetchedLists.map(async (fl) => {
        const peers = await fetchListPeersBlockchain(fl.id);
        for (let i = 0; i < peers.length; i++) {
          setPeerAddresses((prev) => [...prev, { id: fl.id, peer: peers[i] }]);
        }
      })
    );
    */

    // folgende Zeilen dann anpassen bzw. löschen:

    await Promise.all(
      ipnsKeys.current.map(async (l) => {
        // anpassen auf Array
        const keyPair = await deserializeKeys(l.key);
        deserKeys.current.push({ id: l.id, key: keyPair.publicKey });
        //alert(`stuff: ${l.id}, ${keyPair.publicKey}`);
      })
    );

    await Promise.all(
      deserKeys.current.map(async (l) => {
        const result = await resolveFromIpns(l.key);

        const aESKey = aESKeys.current.find(
          (keyObj) => keyObj.id === l.id
        ).aESKey;
        alert(`aesKey at fetching in the useref: ${aESKey}`);
        const list = await fetchFromPinata(result.cid, aESKey); // Parameter: AES-Key-
        // (in der fetchFromPinata() erfolgt die Entschlüsselung der Listen, JSON parsen)-

        setLists((prev) => [...prev, list]);
      })
    );
  };

  const deleteList = async (deletedList) => {
    // Löschen im Smart Contract-
    // unpinnen im Pinata-
    // löschen aus Liste-Mapping und ipnsKeys-Array, AES-Key-Array, deserKeys, Peer-UseState-

    try {
      await deleteListBlockchain(deletedList.id);
      alert(`deletion from blockchain complete`);
    } catch (error) {
      alert(`deletion from blockchain unsuccessful`);
      return;
    }
    // unpin:-
    deserKeys.current.map(async (l) => {
      if (l.id == deletedList.id) {
        const cid = resolveFromIpns(l.key);
        await unpinFromPinata(cid);
      }
    });

    setLists((l) => l.filter((item) => item.id !== deletedList.id));
    ipnsKeys.current = ipnsKeys.current.filter(
      (item) => item.id !== deletedList.id
    );
    aESKeys.current = aESKeys.current.filter(
      (item) => item.id !== deletedList.id
    );
    deserKeys.current = deserKeys.current.filter(
      (item) => item.id !== deletedList.id
    );
    setPeerAddresses((l) => l.filter((item) => item.id !== deletedList.id));
  };

  const clearLists = () => {
    // Arrays austauschen, AES-Keys, Peer-UseState auch einbauen-
    const resetList = [];
    const resetPeerAddresses = [];
    setLists(resetList);
    ipnsKeys.current = [];
    aESKeys.current = [];
    deserKeys.current = [];
    setPeerAddresses(resetPeerAddresses);
  };

  const updateList = (updatedList) => {
    const updatedLists = lists.map((list) =>
      list.id === updatedList.id ? updatedList : list
    );
    setLists(updatedLists);
  };

  const shareList = async (id, peer) => {
    alert(`sharing`);
    // (GUI-Input-Feld:) Peer-Adresse, Button-Click: Adresse & ListenID-
    try {
      const peerRSAPubKeyString = await getRSAPubKeyBlockchain(peer);
      const peerRSAPublicKey = await importRSAPublicKey(peerRSAPubKeyString);
      const peerEncryptedAESKeyString = await encryptRSA(
        aESKeys.current.find((keyObj) => keyObj.id == id).aESKey,
        peerRSAPublicKey
      );
      await shareListBlockchain(peer, id, peerEncryptedAESKeyString);
    } catch (error) {
      alert(`sharing unsuccessful, error: ${error}`);
      return;
    }
    setPeerAddresses((prev) => [...prev, { id: id, peer: peer }]);
    // Blockchain-Funktion: Peer-RSA-Pubkey holen, AES-Key verschlüsseln, Share-Funktion aufrufen-
    // Peer-Adresse mit ListenID in useState-
  };

  const unshareList = async (id, peer) => {
    alert(`unsharing`);
    // (GUI-Button:) Peer-Adresse - Button-Click: Adresse & ListenID-
    // Blockchain-Funktion: ruft SC auf -
    //                      ...Test auf requires (z.B. unshare mit mir selbst als letztem User), sonst return und retval prüfen
    //                      ...macht: SC-Funktion aufrufen, User löschen etc.
    try {
      await unshareListBlockchain(peer, id);
    } catch (error) {
      return;
    }
    // falls geklappt: Peer-Adressenobjekt aus useState löschen-
    // (Synchronisation mit Peer -> unlösbar? bleibt in seinem Programm bis er neu fetcht) loose end!
    // if: unshare mit mir selbst -> Listendaten aus useStates und Arrays entfernen-
    if (peer === accountMetaMask) {
      setLists((prev) => prev.filter((item) => item.id !== id));
      ipnsKeys.current = ipnsKeys.current.filter((item) => item.id !== id);
      aESKeys.current = aESKeys.current.filter((item) => item.id !== id);
      deserKeys.current = deserKeys.current.filter((item) => item.id !== id);
      setPeerAddresses((l) => l.filter((item) => item.id !== id));
    } else {
      setPeerAddresses((prev) =>
        prev.filter((peerObj) => !(peerObj.id === id && peerObj.peer === peer))
      );
    }
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
            peers={peerAddresses}
            shareList={shareList}
            unshareList={unshareList}
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
        <RSAKeyHandling
          accountMetaMask={accountMetaMask}
          rSAKeyPair={rSAKeyPair}
        />
      </div>
    </div>
  );
};

export default App;
