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
  const templateVars = { urls: urlDatabase, username:req.cookies["username"].username };
  res.render("urls_index", templateVars);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});

app.get("/urls/new", (req, res) => {
  
  res.render("urls_new",req.cookies["username"]);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL:urlDatabase[req.params.id],username:req.cookies["username"].username};
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {

  const id = generateRandomString(6);
  urlDatabase[id] = req.body.longURL;
  
  // Redirect the client to the URL containing the ID
  // res.redirect(`/urls/${id}`);
  res.redirect(`/urls/${id}?usename=${req.cookies["username"].username}`);
});

app.get("/u/:id", (req, res) => {
  // const longURL = ...
  const id = req.params.id;
  const longURL = urlDatabase[id];
  res.redirect(longURL);
});

app.post("/urls/:id/delete",(req,res) =>{
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls" + "?usename=" + req.cookies["username"].username);
});

app.post("/urls/:id/edit",(req,res) =>{
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect("/urls" + "?usename=" + req.cookies["username"].username);
});

app.post("/urls/login",(req,res) =>{
  console.log(req.body);
  res.cookie('username', req.body);
  res.redirect("/urls");
  
});

