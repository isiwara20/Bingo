// Request format and endpoints used by DirectPay's React Native SDK.
const createDirectPaySession = async (session, request = fetch) => {
  const endpoints = {
    DEV: "https://test-gateway.directpay.lk/api/v3/create-session",
    PROD: "https://gateway.directpay.lk/api/v3/create-session",
  };
  const endpoint = endpoints[session.stage];
  if (!endpoint || !session.signature || !session.dataString) {
    throw new Error("Invalid payment configuration. Please contact support.");
  }

  const response = await request(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `hmac ${session.signature}`,
    },
    body: session.dataString,
  });
  const result = await response.json();
  if (!response.ok || Number(result.status) !== 200 ||
      typeof result.data?.link !== "string" || !result.data.link.startsWith("https://")) {
    throw new Error("DirectPay could not start checkout. Please check the merchant credentials and test/live setting.");
  }
  return result.data.link;
};

module.exports = { createDirectPaySession };
