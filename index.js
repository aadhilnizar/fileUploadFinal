
const express = require("express");
const path = require("path");
const ejs = require("ejs");
const bcrypt = require("bcrypt");
const session = require("express-session"); // Import express-session
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
const { collection, files } = require("./config");
const uploads = require("./middlewares/fileupload");
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, "uploads")));

// Configure session middleware
app.use(session({
  secret: 'your_secret_key', // Change this to a secure random value
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/upload", (req, res) => {
  res.render("upload");
});

app.post("/signup", async (req, res) => {
  const data = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
  };
  const existingUser = await collection.findOne({ email: data.email });
  if (existingUser) {
    return res.send("<h1>User already Exists</h1>");
  } else {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    data.password = hashedPassword;
    await collection.insertOne(data); // Use insertOne instead of insertMany for a single user
  }
  res.redirect("/");
});

app.post("/", async (req, res) => {
  try {
    const check = await collection.findOne({ email: req.body.email });
    if (!check) {
      res.send("User not found");
      return;
    }

    const passmatch = await bcrypt.compare(req.body.password, check.password);
    if (passmatch) {
      // Store user info in session
      req.session.userId = check._id; // Store user ID in session
      res.redirect("/library");
    } else {
      res.send("Wrong password");
    }
  } catch (error) {
    console.log("Wrong details", error);
  }
});

app.get("/reset-password", (req, res) => {
  res.render("forgot-password");
});

app.get("/email", (req, res) => {
  res.render("email");
});

// Protected route
app.get("/library", async (req, res) => {
  if (!req.session.userId) { // Check if user is authenticated
    return res.redirect("/"); // Redirect to login if not authenticated
  }

  const file = await files.find({});
  res.render('library', { files: file });
});

app.get('/password', (req, res) => {
  res.render('password');
});

app.post('/email', async (req, res) => {
  const { email } = req.body;
  console.log("Email received for password update:", email);
  const user = await collection.findOne({ email });
  if (!user) {
    return res.status(404).send('User not found');
  }
  res.render('password', { email });
});

app.post('/password', async (req, res) => {
  const { email, newPassword } = req.body;
  console.log('email in the password block', email);
  
  try {
    const user = await collection.findOne({ email });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.send('Password updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating password');
  }
});

// Route to handle multiple file uploads
app.post("/upload", uploads.array("files", 10), async (req, res) => {
  const file = req.files.map((f) => {
    return { fileName: f.filename };
  });
  const success = await files.insertMany(file);
  if (!success) {
    return res.status(400).json({ error: "No files uploaded" });
  }
  res.redirect('/upload');
});

app.listen(5000, () => {
  console.log("Server Running at port 5000");
});
