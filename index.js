// A simple Node.js Express server to generate PayHere hash securely

const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Replace this with your actual merchant secret
const MERCHANT_SECRET = "NTM3NzEwMTA3MTU0MzQ4NzEwNDM3OTQzMjI1MzA0MTExNTAwMzc3";

app.use(cors());
app.use(bodyParser.json;

app.post("/generate-hash", (req, res) => {
  const { merchant_id, order_id, amount, currency } = req.body;

  if (!merchant_id || !order_id || !amount || !currency) {
    return res.status(400).json({ error: "Missing parameters." });
  }

  const data = merchant_id + order_id + amount + currency + MERCHANT_SECRET;
  const hash = crypto.createHash("md5").update(data).digest("hex");

  return res.json({ hash });
});

app.listen(PORT, () => {
  console.log(`✅ Hash server running on port ${PORT}`);
});
