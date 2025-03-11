export const createAESKey = async () => {
  try {
    const aESKey = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );
    alert(`generated key: ${aESKey}`);
    return aESKey;
  } catch (error) {
    alert(`key gen unsuccessful`);
    return null;
  }
};

export const encryptAES = async (list, aESKey) => {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialisierungsvektor - 12 Byte fr AES-GCM
  const encodedList = new TextEncoder().encode(JSON.stringify(list)); // zuerst in String, dann in Bytes konvertieren
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aESKey,
    encodedList
  );
  const encryptedArray = new Uint8Array(encryptedBuffer);
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv);
  combined.set(encryptedArray, iv.length);

  const returnbuffer = combined.buffer.slice(0);
  return returnbuffer;
};

export const decryptAES = async (combined, aESKey) => {
  const iv = combined.slice(0, 12); // 12 Bytes am Anfang -> IV
  const ciphertext = combined.slice(12); // Rest: Ciphertext

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aESKey,
      ciphertext
    );

    const decryptedString = new TextDecoder.decode(decryptedBuffer);
    return JSON.parse(decryptedString);
  } catch (error) {
    alert(`AES decryption failed: ${error}`);
    return null;
  }
};
