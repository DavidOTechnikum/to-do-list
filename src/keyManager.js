import { useState } from "react";
import { Buffer } from "buffer";

const KeyManager = ({ accountMetaMask }) => {
  const [publicKey, setPublicKey] = useState(null);

  const getPublicKey = async () => {
    const keyB64 = await window.ethereum.request({
      method: "eth_getEncryptionPublicKey",
      params: [accountMetaMask]
    });
    alert(`pubkey: ${keyB64}`);
    //setPublicKey(Buffer.from(keyB64, "base64").toString("hex"));
  };

  return (
    <div>
      <button onClick={getPublicKey}>Get public key</button>
      {publicKey && <p>Public Key: {publicKey}</p>}
    </div>
  );
};

export default KeyManager;

/*
import { useState } from "react";

const KeyManager = () => {
  const [keyPair, setKeyPair] = useState(null);

  const generateKeyPair = async () => {
    const keys = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256"
      },
      true,
      ["encrypt", "decrypt"]
    );

    const publicKey = await window.crypto.subtle.exportKey(
      "spki",
      keys.publicKey
    );
    const privateKey = await window.crypto.subtle.exportKey(
      "pkcs8",
      keys.privateKey
    );

    const keyData = {
      publicKey: arrayBufferToBase64(publicKey),
      privateKey: arrayBufferToBase64(privateKey)
    };

    setKeyPair(keyData);
    saveToFile(JSON.stringify(keyData, null, 2), "keypair.json");

    // Here: function to save to Smart Contract!!!
  };

  const saveToFile = (content, fileName) => {
    const blob = new Blob([content], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setKeyPair(data);
        alert(`Loaded key pair: ${data.publicKey}`);
      } catch (error) {
        alert(`Invalid file format`);
      }
    };
    reader.readAsText(file);
  };

  const arrayBufferToBase64 = (buffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  };

  return (
    <div>
      <button onClick={generateKeyPair}>Generate & Save Key pair</button>
      <input type="file" onChange={loadFile} />
      {keyPair && <pre>{JSON.stringify(keyPair, null, 2)}</pre>}
    </div>
  );
};

export default KeyManager;
*/
