const express = require("express");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
  TTxRvb:{
    longURL: "https://www.sina.com.cn",
    userID: "userRandomID",
  }
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "dd@cmc.com",
    password: "dddd",
  },
  aJ48lW:{
    id: "aJ48lW",
    email:"dav@gmail.com",
    password: "dddaaavvv",
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

const urlsForUser = (id) =>{
  const myUrls = {};
  for (let u in urlDatabase) {
    if (urlDatabase[u].userID === id) {
      myUrls[u] = urlDatabase[u].longURL;
    }
  }

  return myUrls;
};

const uIdForUser = (id, userid) => {
  if (urlDatabase[id].userID === userid) {
    return true;
  }
  return false;
};

app.get("/urls", (req, res) => {
  
  const templateVars = {};
  let user = users[req.cookies["user_id"]];
  
  if (!user) {
    user = {};
    return res.redirect("/login");
  }
  templateVars.user = user;
  const myUrls = urlsForUser(user.id);
  templateVars.myUrls = myUrls;

  res.render("urls_index", templateVars);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});

app.get("/register",(req,res)=>{
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  } else {
    const templateVars = { greeting: "Welcome regester!" };
    templateVars.user = {};
    res.render("register", templateVars);
  }
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (email === "" || password === "") {
    return res.status(400).send("Email and password cannot be empty!");
  }
  if (getUserByEmail(email)) {
    return res.status(400).send("EXIST USER");
  }
  const id = generateRandomString("6");
  const hashedPassword = bcrypt.hashSync(password,10);
  
  users[id] = { id, email, hashedPassword };

  res.cookie('user_id', id);
  return res.redirect("/urls");

});

const getUserByEmail = (email)=>{
  for (let u in users) {
    if (users[u].email === email) return users[u].id;
  }
  return null;
};

app.get("/login",(req,res)=>{
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  } else {
    const templateVars = { greeting: "Welcome login!" };
    templateVars.user = {};
    res.render("login", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  let user = {};
  if (req.cookies["user_id"]) {
    user = users[req.cookies["user_id"]];
    res.render("urls_new",{user});
  } else {
    res.render("login",{user});
  }
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL:urlDatabase[req.params.id].longURL};
  const user = users[req.cookies["user_id"]];
  if (user.id === urlDatabase[req.params.id].userID) {
    templateVars.user = user;
    return res.render("urls_show", templateVars);
  } else {
    return res.status("400").send("Not permitted");
  }

});

app.post("/urls", (req, res) => {
  if (req.cookies["user_id"]) {
    const id = generateRandomString(6);
    urlDatabase[id] = {};
    urlDatabase[id].longURL = req.body.longURL;
    urlDatabase[id].userID = req.cookies["user_id"];

    // Redirect the client to the URL containing the ID
    res.redirect(`/urls/${id}`);
  } else {
    res.render("login", { error: "please login first~" });
  }
});

app.get("/u/:id", (req, res) => {
  
  const id = req.params.id;
  let longURL = null;
  for (let u in urlDatabase) {
    if (u === id) {
      longURL = urlDatabase[u].longURL;
    }
  }

  if (longURL) {
    return res.redirect(longURL);
  } else {
    return res.status(400).send("short URL doesn't exist");
  }
});

app.post("/urls/:id/delete",(req,res) =>{
  const id = req.params.id;
  const userid = req.cookies["user_id"];
  if (uIdForUser(id, userid)) {
    delete urlDatabase[id];
    res.redirect("/urls");
  } else {
    res.status(400).send("Permission denied. ");
  }
});

app.post("/urls/:id/edit",(req,res) =>{
  const id = req.params.id;
  const userid = req.cookies["user_id"];
  if (uIdForUser(id, userid)) {
    urlDatabase[id].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.status(400).send("Permission denied. ");
  }
});

app.post("/login",(req,res) =>{
 
  const email = req.body.email;
  const password = req.body.password;
  const userid = getUserByEmail(email);
  
  if (userid !== null) {
    res.cookie("user_id", userid);

    if (users[userid].email === email && bcrypt.compareSync(password, users[userid].hashedPassword)) {
      //
      const myUrls = urlsForUser(userid);

      res.render("urls_index", { myUrls: myUrls, user: users[userid] });
    } else {
      return res.status(403).send("email and password doesn't match!");
    }
  } else {
    return res.status(403).send("Unexiting email, please register first!");
  }
  
});

app.post("/logout",(req,res) =>{

  res.clearCookie('user_id');
  res.redirect("/login");
});

