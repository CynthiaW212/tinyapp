const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  }
};

const generateRandomString = (length)=> {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json",(req,res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase};

  let user = users[req.cookies["user_id"]];
  if (!user) {
    user = {};
  }
  templateVars.user = user;
  res.render("urls_index", templateVars);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});

app.get("/register",(req,res)=>{
  const templateVars = { greeting: "Welcome regester!" };
  templateVars.user = {};
  res.render("register", templateVars);
});

app.post("/register",(req,res)=>{
  const email = req.body.email;
  const password = req.body.password;

  if (email === "" || password === "") {
    return res.status(400).send("Email and password cannot be empty!");
  } else if (getUserByEmail(email)) {
    return res.status(400).send("EXIST USER");
  } else {
    const id = generateRandomString("6");
    users[id] = { id, email, password };

    res.cookie('user_id', id);
    return res.redirect("/urls");
  }
});

const getUserByEmail = (email)=>{
  for (let u in users) {
    if (users[u].email === email) return users[u].id;
  }
  return null;
};

app.get("/login",(req,res)=>{
  const templateVars = { greeting: "Welcome login!" };
  templateVars.user = {};
  res.render("login", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    const user = users[req.cookies["user_id"]];
    res.render("urls_new",{user});
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL:urlDatabase[req.params.id]};
  const user = users[req.cookies["user_id"]];
  templateVars.user = user;
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {

  const id = generateRandomString(6);
  urlDatabase[id] = req.body.longURL;
  
  // Redirect the client to the URL containing the ID
  res.redirect(`/urls/${id}`);
});

app.get("/u/:id", (req, res) => {
  
  const id = req.params.id;
  const longURL = urlDatabase[id];
  res.redirect(longURL);
});

app.post("/urls/:id/delete",(req,res) =>{
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/urls/:id/edit",(req,res) =>{
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login",(req,res) =>{
 
  const email = req.body.email;
  const password = req.body.password;
  const userid = getUserByEmail(email);
  
  if (userid !== null) {
    res.cookie("user_id", userid);
    if (users[userid].email === email && users[userid].password === password) {
      
      res.render("urls_index", { urls: urlDatabase, user: users[userid] });
    } else {
      return res.status(403).send("email and password doesn't match!");
    }
  } else {
    return res.status(403).send("Unexiting email, please register first!");
  }
  
});

app.post("/urls/logout",(req,res) =>{

  res.clearCookie('user_id');
  res.redirect("/login");
});

