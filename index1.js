const express = require("express");
const path = require("path");
const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp, cert } = require('firebase-admin/app');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();

// Firebase setup
const serviceAccount = require("./firebaseServiceKey.json"); // Changed file name for service account key
initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

// Middleware
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "static"))); // Changed static folder name
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.render("home"); // Changed template name
});

app.get("/login", (req, res) => {
  res.render("login"); // Changed template name
});

app.get("/signup", (req, res) => { // Changed route name
  res.render("signup"); // Changed template name
});

// Handle registration
app.post("/signup", async (req, res) => { // Changed route name
  const { fullname, phoneNumber, emailAddress, password } = req.body; // Changed variable names

  try {
    // Check for existing email
    const userSnapshot = await db.collection('users').where('emailAddress', '==', emailAddress).get(); // Changed collection and variable names

    if (!userSnapshot.empty) {
      return res.status(400).send("Email is already registered");
    }

    // Encrypt the password
    const encryptedPassword = await bcrypt.hash(password, 10);

    // Store the new user
    await db.collection('users').add({ fullname, phoneNumber, emailAddress, password: encryptedPassword }); // Changed variable names
    res.send("Registration successful");
  } catch (error) {
    res.status(500).send("Error during registration: " + error.message);
  }
});

// Handle login
app.post("/login", async (req, res) => {
  const { emailAddress, password } = req.body; // Changed variable names

  try {
    const userSnapshot = await db.collection('users').where('emailAddress', '==', emailAddress).get(); // Changed collection and variable names

    if (userSnapshot.empty) {
      return res.status(400).send("Incorrect email or password");
    }

    for (const doc of userSnapshot.docs) {
      const user = doc.data();
      const isPasswordCorrect = await bcrypt.compare(password, user.password); // Changed variable names
      if (isPasswordCorrect) {
        return res.render('dashboard'); // Changed template name
      }
    }

    res.status(400).send("Incorrect email or password");
  } catch (error) {
    res.status(500).send("Error during login: " + error.message);
  }
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
