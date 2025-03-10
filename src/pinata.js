import { PinataSDK } from "pinata-web3";
import { decryptAES, encryptAES } from "./AESEncryption";

const pinata = new PinataSDK({
  pinataJwt:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxNzI0N2YwZS01ZThiLTRlZGMtYmI2MC03NjkxNTM1ZTc5ZDUiLCJlbWFpbCI6ImljMjJiMDExQHRlY2huaWt1bS13aWVuLmF0IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6Ijg2ZTY2ODczYTk1MjVlNjU2MmU1Iiwic2NvcGVkS2V5U2VjcmV0IjoiZTA5NTg1MzFmNTMxOTRmODI1MTFkNDY2Y2U0ZDU2MjVmZGZkNDE4ZTg1NTRlN2QzNmViMjI3ZTI5M2JiNGUxMyIsImV4cCI6MTc2NjgzNzQ5OX0.WxXNORdcuRZLnB9KwaVSnht5Mac0vHbXariyAi0rimY",
  pinataGateway: "copper-quiet-swordtail-130.mypinata.cloud"
});

// Verschlüsselung!-
export const uploadToPinata = async (list, aESKey) => {
  const ciphertextIv = encryptAES(list, aESKey);
  const ciphertextIvString = new TextDecoder().decode(ciphertextIv);
  try {
    const result = await pinata.upload.json({ list: ciphertextIvString }); // für Pinata-Upload: verschlüsselte Daten als String
    alert(`Pinata upload successful`); // in Objekt eingebettet, weil JSON-Upload am besten funktioniert
    return result.IpfsHash;
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    throw error;
  }
};

export const fetchFromPinata = async (cid, aESKey) => {
  // Parameter: AES-Key-
  alert(`fetching from pinata started`);
  try {
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
    const encryptedList = new TextEncoder().encode(response.list); // Pinata: JSON wurde gespeichert, enthält versch. Daten
    const list = decryptAES(encryptedList, aESKey);
    return list;
  } catch (error) {
    return null;
  }
};

export const unpinFromPinata = async (cid) => {
  try {
    const response = await pinata.unpin([`${cid}`]);
    alert(`unpinned cid: ${response.cid}`);
  } catch (error) {
    console.error("Error unpinninig from Pinata:", error);
    throw error;
  }
};
