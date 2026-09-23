jest.mock("https", () => ({ request: jest.fn() }));
const https = require("https");
const { EventEmitter } = require("events");
const { sendWhatsApp } = require("../src/services/otpService");
const original = { ...process.env };
beforeEach(() => {
  jest.clearAllMocks();
  process.env.WACLIENT_INSTANCE_ID = "test-instance";
  process.env.WACLIENT_ACCESS_TOKEN = "test-token";
});
afterAll(() => { process.env = original; });
const provider = (statusCode, body) => {
  https.request.mockImplementation((options, callback) => {
    const req = new EventEmitter();
    req.write = jest.fn(); req.setTimeout = jest.fn(); req.destroy = jest.fn();
    req.end = () => { const res = new EventEmitter(); res.statusCode = statusCode; callback(res); res.emit("data", body); res.emit("end"); };
    return req;
  });
};
test("accepts successful WhatsApp delivery", async () => {
  provider(200, '{"status":"success"}');
  await expect(sendWhatsApp("0771234567", "test message", { requireDelivery: true })).resolves.toBeUndefined();
  const req = https.request.mock.results[0].value;
  expect(JSON.parse(req.write.mock.calls[0][0]).number).toBe("94771234567");
  expect(req.setTimeout).toHaveBeenCalledWith(15000, expect.any(Function));
});
test.each([[200, '{"status":"error"}'], [500, '{"status":"success"}'], [200, 'invalid json']])("rejects failed provider response (%s)", async (status, body) => {
  provider(status, body);
  await expect(sendWhatsApp("0771234567", "test message", { requireDelivery: true })).rejects.toThrow();
});
test("recovery cannot silently fall back to logging a code in development", async () => {
  process.env.NODE_ENV = "development";
  delete process.env.WACLIENT_INSTANCE_ID; delete process.env.WACLIENT_ACCESS_TOKEN;
  await expect(sendWhatsApp("0771234567", "test message", { requireDelivery: true })).rejects.toThrow("not configured");
  expect(https.request).not.toHaveBeenCalled();
});
