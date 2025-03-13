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

// Datentypen zum Ver-/Entschlüsseln:
// Objekt -> JSON -> Uint8Array für AES encrypt
// AES encrypt -> ArrayBuffer
// ArrayBuffer concat IV
// Combined -> Base64 -> String in JSON

export const encryptAES = async (list, aESKey) => {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialisierungsvektor - 12 Byte fr AES-GCM
  const encodedList = new TextEncoder().encode(JSON.stringify(list)); // zuerst in String, dann in Uint8Array konvertieren

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aESKey,
    encodedList
  );

  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  //const returnbuffer = Buffer.from(combined);
  //const returnbuffer = combined.buffer.slice(0);
  //const returnString = Buffer.from(combined).toString("base64");
  const returnString = btoa(String.fromCharCode(...combined));
  return returnString;
};

export const decryptAES = async (combinedString, aESKey) => {
  //alert(`combined: ${combinedString}`);

  //const combined = new Uint8Array(Buffer.from(combinedString, "base64"));
  const combined = new Uint8Array(
    atob(combinedString)
      .split("")
      .map((char) => char.charCodeAt(0))
  );

  if (combined.byteLength < 13) {
    throw new Error("invalid ciphertext: too short for AES-GCM decryption");
  }

  const iv = combined.slice(0, 12); // 12 Bytes am Anfang -> IV
  const ciphertext = combined.slice(12); // Rest: Ciphertext

  //alert(`IV length: ${iv.length} and IV Data: ${iv}`);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aESKey,
      ciphertext
    );

    const decryptedString = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decryptedString);
  } catch (error) {
    alert(`AES decryption failed: ${error}`);
    return null;
  }
};
