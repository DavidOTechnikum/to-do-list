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

export const newPublishToIpns = async (cid, keyPair) => {
  alert(`IPNS publishing started, cid: ${cid}`);
  const result = await nameservice.publish(keyPair, cid, {
    allowOverwrite: true
  });
  // use result for debugging:
  alert(`published to ipns: ${result.value}; pubkey: ${keyPair.publicKey}`);
};

export const republishToIpns = async (keyPairString, cid) => {
  alert(`republishing started, cid: ${cid}`);
  const serializedKeyPair = new Uint8Array(
    atob(keyPairString)
      .split("")
      .map((char) => char.charCodeAt(0))
  );
  const deserKeyPair = privateKeyFromProtobuf(serializedKeyPair);
  // IPNS:
  const result = await nameservice.publish(deserKeyPair, cid, {
    allowOverwrite: true
  });
  // use result for debugging:
  alert(`republished: ${result.value}; pubkey: ${deserKeyPair.publicKey}`);
  //resolveFromIpns(deserKeyPair.publicKey);
};

export const serializeKeys = (keyPair) => {
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
  alert(`resolving started`);
  try {
    //const result = await nameservice.resolve(publicKey);

    const result = await withTimeout(
      nameservice.resolve(publicKey, { nocache: true, offline: false })
    );
    alert(`resolved: ${result.cid}`);
    return result;
  } catch (error) {
    alert(`resolving unsuccessful, error: `, error.stack);
    return null;
    //return {
    //id: "x",
    //cid: "bafkreifdimlownfs452g6lby26i2yzos3q7hhqx7fgyo4rawgtiqz24ch4"
    //};
  }
};
