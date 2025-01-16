// deprecated

import { FleekSdk, PersonalAccessTokenService } from "@fleek-platform/sdk/node";

// Initialize Fleek client
const accessTokenService = new PersonalAccessTokenService({
  personalAccessToken: "pat_Hb94-48Eq-XX7d5CaVUO",
  projectId: "Todolist"
});

const fleekSdk = new FleekSdk({
  accessTokenService
});

// Function to upload JSON to Fleek
export const uploadToFleek = async (list) => {
  try {
    const jsonString = JSON.stringify(list);

    const response = await fleekSdk.storage().uploadFile(jsonString);

    console.log("Uploaded to Fleek:", response);
    return response.pin.cid; // This is the IPFS CID
  } catch (error) {
    console.error("Error uploading to Fleek:", error);
    throw error;
  }
};

// Function to fetch JSON from Fleek using CID
export const fetchFromFleek = async (cid) => {
  try {
    const response = await fleekSdk.storage().get({ cid: { cid } });

    console.log("Fetched from Fleek:", response);
    return JSON.parse(response); // Convert the data back to a JSON object
  } catch (error) {
    console.error("Error fetching from Fleek:", error);
    throw error;
  }
};
