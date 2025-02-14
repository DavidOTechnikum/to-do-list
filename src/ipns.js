import { createHelia } from "helia";
import { ipns } from "@helia/ipns";
import {
  generateKeyPair,
  importKey,
  privateKeyFromProtobuf,
  privateKeyToProtobuf
} from "@libp2p/crypto/keys";

const helia = await createHelia();
const nameservice = ipns(helia);

export const newPublishToIpns = async (cid) => {
  const keyPair = await generateKeyPair("Ed25519");
  const result = await nameservice.publish(keyPair, cid);
  // use result for debugging:
  alert(`published to ipns: ${result.value}; pubkey: ${keyPair.publicKey}`);
  const serializedKeyPair = serializeKeys(keyPair);
  alert(`deserialized ipns value: ${serializedKeyPair}`);
  return serializedKeyPair;
};

export const republishToIpns = async (keyPairString, cid) => {
  //const keyPair = deserializeKeys(keyPairString);
  // function above works, but return doesnt?
  // therefore: the function's code pasted starting here
  const serializedKeyPair = new Uint8Array(
    atob(keyPairString)
      .split("")
      .map((char) => char.charCodeAt(0))
  );
  const deserKeyPair = privateKeyFromProtobuf(serializedKeyPair);
  // to here.
  alert(`pubkey of deserkey for republishing: ${deserKeyPair.publicKey}`);
  const result = await nameservice.publish(deserKeyPair, cid);
  // use result for debugging:
  alert(`republished: ${result.value}`);
  resolveFromIpns(deserKeyPair.publicKey);
};

const serializeKeys = (keyPair) => {
  const serializedKeyPair = privateKeyToProtobuf(keyPair);
  const serializedKeyPairString = btoa(
    String.fromCharCode(...serializedKeyPair)
  );
  return serializedKeyPairString;
};

export const deserializeKeys = async (serializedKeyPairString) => {
  const serializedKeyPair = new Uint8Array(
    atob(serializedKeyPairString)
      .split("")
      .map((char) => char.charCodeAt(0))
  );
  const keyPair = privateKeyFromProtobuf(serializedKeyPair);
  return keyPair;
};

function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout exceeded")), ms)
  );
  return Promise.race([promise, timeout]);
}

export const resolveFromIpns = async (publicKey) => {
  alert(`hello, baby`);
  try {
    //const result = await nameservice.resolve(publicKey);

    const result = await withTimeout(nameservice.resolve(publicKey), 5000);
    alert(`resolved: ${result.cid}`);
    return result;
  } catch (error) {
    alert(`resolving unsuccessful, error: `, error.stack);
    return {
      id: "x",
      cid: "bafkreifdimlownfs452g6lby26i2yzos3q7hhqx7fgyo4rawgtiqz24ch4"
    };
  }
};

/*
export const publishToIpns = async (cid) => {
  const privateKey = await generateKeyPair("Ed25519");

  // Convert private key to Protobuf
  const serializedPrivateKey = privateKeyToProtobuf(privateKey);

  // Convert Uint8Array to a Base64 string
  const serializedString = btoa(String.fromCharCode(...serializedPrivateKey));

  // Store in localStorage or other storage
  localStorage.setItem("ed25519PrivateKey", serializedString);

  const serializedString2 = localStorage.getItem("ed25519PrivateKey");
  alert(`serialized Protobuf from Storage: ${serializedString2}`);

  if (!serializedString2) {
    throw new Error("No private key found in storage!");
  }

  // Convert Base64 string back to Uint8Array
  const serializedPrivateKey2 = new Uint8Array(
    atob(serializedString2)
      .split("")
      .map((char) => char.charCodeAt(0))
  );

  // Convert Protobuf to private key object
  const privateKey2 = await privateKeyFromProtobuf(serializedPrivateKey2);

  const result = await nameservice.publish(privateKey2, cid);

  alert(`result: ${result.signatureV2} and the pubkey: ${privateKey2.publicKey} and
  the OG pubkey: ${privateKey.publicKey}`);
  return privateKey2.publicKey;
};
*/
