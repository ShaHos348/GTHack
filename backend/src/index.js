const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Test route
app.get("/", (req, res) => {
  res.send("🚀 Backend is working!");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
