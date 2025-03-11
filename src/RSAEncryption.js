import { useState } from "react";
import {
  storeRSAPubKeyBlockchain,
  getRSAPubKeyBlockchain
} from "./UserListManagementService";

export const encryptRSA = async (aESKey, rSAPublicKey) => {
  const exportedAESKey = await crypto.subtle.exportKey("raw", aESKey);
  const encryptedAESKey = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    rSAPublicKey,
    exportedAESKey
  );
  const encryptedAESKeyString = new TextDecoder().decode(encryptedAESKey);
  return encryptedAESKeyString;
};

export const decryptRSA = async (encryptedAESKeyString, rSAPrivateKey) => {
  const encryptedAESKeyArray = new TextEncoder().encode(encryptedAESKeyString);
  const encryptedAESKey = encryptedAESKeyArray.buffer.slice(0);
  const decryptedAESKey = await crypto.subtle.decrypt({
    name: "RSA-OEAP",
    rSAPrivateKey,
    encryptedAESKey
  });
  const aESKey = await crypto.subtle.importKey(
    "raw",
    decryptedAESKey,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
  return aESKey;
};

export const importRSAPublicKey = async (publicKeyString) => {
  const publicKeyBuffer = base64ToArrayBuffer(publicKeyString);
  const publicKey = await crypto.subtle.importKey(
    "spki",
    publicKeyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    true,
    ["encrypt"]
  );
  return publicKey;
};

const importRSAPrivateKey = async (privateKeyString) => {
  const privateKeyBuffer = base64ToArrayBuffer(privateKeyString);
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    true,
    ["decrypt"]
  );
  return privateKey;
};

const base64ToArrayBuffer = (base64) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const RSAKeyHandling = ({ accountMetaMask, rSAKeyPair }) => {
  const generateRSAKeyPair = async () => {
    const rSAKeys = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256"
      },
      true,
      ["encrypt", "decrypt"]
    );

    const rSAPublicKey = await window.crypto.subtle.exportKey(
      "spki",
      rSAKeys.publicKey
    );
    const rSAPrivateKey = await window.crypto.subtle.exportKey(
      "pkcs8",
      rSAKeys.privateKey
    );

    const rSAKeyData = {
      rSAPublicKey: arrayBufferToBase64(rSAPublicKey),
      rSAPrivateKey: arrayBufferToBase64(rSAPrivateKey)
    };

    try {
      await storeRSAPubKeyBlockchain(rSAKeyData.rSAPublicKey, accountMetaMask);
    } catch (error) {
      return error;
    }

    rSAKeyPair.current = rSAKeys;
    saveToFile(JSON.stringify(rSAKeyData, null, 2), "keypair.json");
  };

  const arrayBufferToBase64 = (buffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
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
    rSAKeyPair.current = null;
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = await JSON.parse(e.target.result);
        const storedRSAPubKey = await getRSAPubKeyBlockchain(accountMetaMask);
        if (storedRSAPubKey === data.rSAPublicKey) {
          const rSAPrivateKey = await importRSAPrivateKey(data.rSAPrivateKey);
          const rSAPublicKey = await importRSAPublicKey(data.rSAPublicKey);
          rSAKeyPair.current = {
            privateKey: rSAPrivateKey,
            publicKey: rSAPublicKey
          };
        } else {
          alert(`loaded key not stored in blockchain`);
          return;
        }

        alert(`Loaded key pair: ${rSAKeyPair.current.publicKey}`);
      } catch (error) {
        alert(`Invalid file format`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <button onClick={generateRSAKeyPair}>
        Generate, Save & Publish Key pair
      </button>
      <input type="file" onChange={loadFile} />
      {rSAKeyPair ? (
        <pre>Key pair set</pre>
      ) : (
        <pre>
          No RSA key pair set. Load RSA key pair from file or generate new pair.
        </pre>
      )}
    </div>
  );
};

export default RSAKeyHandling;
