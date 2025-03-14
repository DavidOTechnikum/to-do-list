const CLOUDFLARE_WORKER_URL = "https://2dolist.ic22b011.workers.dev/";
const timeToLive = 300; // Maximum TTL value (68 years)

export const publishDNSLink = async (subdomain, cid) => {
  const zoneId = process.env.REACT_APP_CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.REACT_APP_CLOUDFLARE_API_TOKEN;
  const domain = process.env.REACT_APP_CLOUDFLARE_DOMAIN;
  const recordName = `${subdomain}.${domain}`;

  const response = await fetch(`${CLOUDFLARE_WORKER_URL}?zone=${zoneId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`
    },
    body: JSON.stringify({
      type: "TXT",
      name: recordName,
      content: `dnslink=/ipfs/${cid}`,
      ttl: timeToLive
    })
  });
  alert(`DNS response: ${response.success}`);
  return response.json();
};

export const updateDNSLink = async (subdomain, newCid) => {
  const zoneId = process.env.REACT_APP_CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.REACT_APP_CLOUDFLARE_API_TOKEN;
  const domain = process.env.REACT_APP_CLOUDFLARE_DOMAIN;
  const recordName = `${subdomain}.${domain}`;
  const longTTL = 2147483647; // Maximum TTL value (68 years)

  // Step 1: Get the existing record ID using the Worker
  const recordsResponse = await fetch(
    `${CLOUDFLARE_WORKER_URL}?zone=${zoneId}&name=${recordName}`,
    {
      headers: { Authorization: `Bearer ${apiToken}` }
    }
  );

  const records = await recordsResponse.json();
  const recordId = records.result?.[0]?.id;
  if (!recordId) return { error: "DNSLink record not found" };

  // Step 2: Update the record using the Worker
  const updateResponse = await fetch(
    `${CLOUDFLARE_WORKER_URL}?zone=${zoneId}&recordId=${recordId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        type: "TXT",
        name: recordName,
        content: `dnslink=/ipfs/${newCid}`,
        ttl: timeToLive
      })
    }
  );

  return updateResponse.json();
};

export const deleteDNSLink = async (subdomain) => {
  const zoneId = process.env.REACT_APP_CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.REACT_APP_CLOUDFLARE_API_TOKEN;
  const domain = process.env.REACT_APP_CLOUDFLARE_DOMAIN;
  const recordName = `${subdomain}.${domain}`;

  // Step 1: Get the existing record ID using the Worker
  const recordsResponse = await fetch(
    `${CLOUDFLARE_WORKER_URL}?zone=${zoneId}&name=${recordName}`,
    {
      headers: { Authorization: `Bearer ${apiToken}` }
    }
  );

  const records = await recordsResponse.json();
  const recordId = records.result?.[0]?.id;
  if (!recordId) return { error: "DNSLink record not found" };

  // Step 2: Delete the record using the Worker
  const deleteResponse = await fetch(
    `${CLOUDFLARE_WORKER_URL}?zone=${zoneId}&recordId=${recordId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiToken}`
      }
    }
  );

  return deleteResponse.json();
};

export const resolveDNSLink = async (subdomain) => {
  const domain = process.env.REACT_APP_CLOUDFLARE_DOMAIN;
  const recordName = `${subdomain}.${domain}`;

  const response = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${recordName}&type=TXT`,
    {
      headers: { Accept: "application/dns-json" }
    }
  );

  const data = await response.json();
  const txtRecord = data?.Answer?.find(
    (answer) => answer.type === 16
  )?.data.replace(/"/g, "");

  return txtRecord?.replace("dnslink=/ipfs/", "") || null;
};
