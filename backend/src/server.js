const express = require("express");
const admin = require("firebase-admin");

const app = express();
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(require("./serviceKey.json")),
});

app.get("/", async (req, res) => {
  res.send("✅ Server with Firebase is working!");
});

app.get("/users", async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("users").get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
