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

export const publishToIpns = async (cid) => {
  /*
  const keyPair = await generateKeyPair("Ed25519");
  const keyPairProtobuf = await privateKeyToProtobuf(keyPair);
  const keyPairProtoBytes = Buffer.from(keyPairProtobuf).toString("base64");
  localStorage.setItem("abc", keyPairProtoBytes);

  alert(`pubkey: ${localStorage.getItem("abc")}`);
  //const result = await nameservice.publish(keyPair, cid);

  const revertKeyBase64 = localStorage.getItem("abc");
  const revertKeyBytes = Buffer.from(revertKeyBase64, "base64");
  const revertKey = await privateKeyFromProtobuf(revertKeyBytes);
  */

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

export const resolveFromIpns = async (publicKey) => {
  const result = await nameservice.resolve(publicKey);
  //const resultString = JSON.parse(result);
  // const resultString = JSON.stringify(result);
  alert(`resolved: ${result.cid}`);
  return result;
};
