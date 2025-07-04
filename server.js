const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Your actual sandbox merchant secret
const MERCHANT_SECRET = "MjI2MzE2MjkxNTE1MDQ0OTcxMjkzMTcyNjUzNTk0MTQ4OTU4Mzk3MA==";

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🧠 In-memory payment status storage
const paymentStatus = {}; // order_id → { status: "success" | "declined", timestamp }

app.get("/", (req, res) => {
  res.send("✅ PayHere Hash & Status API is Running");
});

// 🔑 Hash generation endpoint
app.post("/generate-hash", (req, res) => {
  const { merchant_id, order_id, amount, currency } = req.body;

  if (!merchant_id || !order_id || !amount || !currency) {
    return res.status(400).json({ error: "Missing parameters." });
  }

  const hashedSecret = crypto.createHash("md5").update(MERCHANT_SECRET).digest("hex").toUpperCase();
  const data = merchant_id + order_id + amount + currency + hashedSecret;
  const hash = crypto.createHash("md5").update(data).digest("hex").toUpperCase();

  console.log("---- HASH DEBUG ----");
  console.log("merchant_id:", merchant_id);
  console.log("order_id:", order_id);
  console.log("amount:", amount);
  console.log("currency:", currency);
  console.log("data string:", data);
  console.log("hash:", hash);
  console.log("---------------------");

  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.json({ hash });
});

// 📩 PayHere notify_url endpoint (POST)
app.post("/notify", (req, res) => {
  const {
    merchant_id,
    order_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig
  } = req.body;

  const hashedSecret = crypto.createHash("md5").update(MERCHANT_SECRET).digest("hex").toUpperCase();
  const localSig = crypto
    .createHash("md5")
    .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret)
    .digest("hex")
    .toUpperCase();

  if (localSig === md5sig) {
    const status = status_code === "2" ? "success" : "declined";
    paymentStatus[order_id] = { status, timestamp: new Date().toISOString() };

    console.log(`✅ Payment status updated: ${order_id} → ${status}`);
    res.status(200).send("Payment status recorded");
  } else {
    console.warn(`❌ Invalid md5sig for order ${order_id}`);
    res.status(400).send("Invalid signature");
  }
});

// 🔍 Client checks payment result
app.get("/check-status/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  const result = paymentStatus[orderId];

  if (!result) {
    return res.status(404).json({ status: "unknown" });
  }

  return res.json({ status: result.status, timestamp: result.timestamp });
});

// 🚀 Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
