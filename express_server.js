const express = require("express");
const helpers = require('./helpers');
const cookieParser = require('cookie-parser');
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

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
  const userId = req.session.userId;
  if (!userId) {
    return res.redirect("/login");
  }
  return res.redirect("/urls");
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



app.get("/urls", (req, res) => {
  
  const userId = req.session.userId;

  if (!userId) {
    // User doesn't login, render login page with error
    return res.render("login",{user:{id: undefined}, error:"Please login first !"});
  }
  
  if (!users[userId]) {
    //UserId doesn't in database, render login page with error
    return res.render("login", { user: { id: undefined }, error: " Invalid user, please login." });
  }

  const user = {id:userId, email:users[userId].email};
  //Get urls based on userId
  const myUrls = urlsForUser(user.id);
  const templateVars = {user, myUrls, error: undefined};

  return res.render("urls_index", templateVars);
});


app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!" };
  return res.render("hello_world", templateVars);
});


app.get("/register",(req,res)=>{

  const userId = req.session.userId;

  if (userId && users[userId]) {
    return res.redirect("/urls");
  }
  const templateVars = { user:{id:undefined}, error:undefined};
  return res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (email === "" || password === "") {
    return res.render("register",{user:{id: undefined}, error:"Email and password cannot be empty !"});
  }

  if (helpers.getUserByEmail(email,users)) {
    // email exists in user database, render register with error
    return res.render("register",{user:{id: undefined}, error:"User exist, please login!"});
  }

  const id = generateRandomString("6");// Get random id
  const hashedPassword = bcrypt.hashSync(password,10);//Encrypt password
  users[id] = { id, email, hashedPassword };//Add new user to user database
  req.session.userId = id;//set session userId

  return res.redirect("/urls");
});


app.get("/login",(req,res)=>{

  const userId = req.session.userId;
  //User exists in userdatabase, redirect to urls page
  if (userId && users[userId]) {
    res.redirect("/urls");
  }

  const templateVars = { user:{id:undefined}, error: undefined };
  res.render("login", templateVars);
  
});

app.get("/urls/new", (req, res) => {
  
  //User doesn't exist, render login page with error
  if (!req.session.userId) {
    return res.render("login",{user:{id: undefined}, error:"Please login first !"});
  }
  const user = users[req.session.userId];
  return res.render("urls_new",{user,error: undefined});
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const user = users[req.session.userId];
  const templateVars = { id, user, longURL:undefined, error: undefined};

  //shorturl doesn't exist in urldatabase,render urls_show with error.
  if (!urlDatabase[id]) {
    templateVars.longURL = undefined;
    templateVars.error = "Short url invalid!";
    return res.status(400).render("urls_show",templateVars);
    
  }

  // shorurl not belong to current user, render urls_show with error.
  if (user.id !== urlDatabase[req.params.id].userID) {
    templateVars.error = "You don't have permission to view this url!";
    return res.status(400).render("urls_show",templateVars);
  }
  //All good, get longURL, render urls_show
  templateVars.longURL = urlDatabase[id].longURL;
  return res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session.userId) {
    // User doesn't login, render login page with error
    return res.render("login",{user:{id: undefined}, error:"Please login first !"});
  }
  const id = generateRandomString(6);
  urlDatabase[id] = { longURL: req.body.longURL, userID: req.session.userId };

  // Redirect the client to the URL containing the ID
  return res.redirect(`/urls/${id}`);
});

app.get("/u/:id", (req, res) => {
  
  const id = req.params.id;
  let longURL = undefined;
  for (let u in urlDatabase) {
    if (u === id) {
      longURL = urlDatabase[u].longURL;
    }
  }
  if (!longURL) {
    return res.status(400).send("Not a valiurlDatabased short url.");
  }
  return res.redirect(longURL);

});

app.post("/urls/:id/delete",(req,res) =>{
  const id = req.params.id;
  const userid = req.session.userId;
  const myUrls = urlsForUser(userid);
  //if url was not creat by current user, render urls_index with error
  if (!helpers.uIdForUser(id, userid,urlDatabase)) {
    return res.status(400).render("urls_index",{ user:users[userid],myUrls:myUrls, error:"You don't have permission to delete this url."});
  }
  delete urlDatabase[id];
  return res.redirect("/urls");
});

app.post("/urls/:id/edit",(req,res) =>{
  const id = req.params.id;
  const userid = req.session.userId;
  //if url was not creat by current user,render urls_show with error
  if (!helpers.uIdForUser(id, userid,urlDatabase)) {
    return res.status(400).render("urls_show",{ id,user:users[userid], longURL:undefined, error:"You don't have permission to edit this url."});
  }
  urlDatabase[id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login",(req,res) =>{
  const email = req.body.email;
  const password = req.body.password;
  const userid = helpers.getUserByEmail(email,users);
  
  if (!userid) {
    // User doesn't exist, render login page with error message
    return res.status(403).render("login", { error: "Unexiting email, please register first!",user:{id: undefined} });
  }

  if (users[userid].email !== email || !bcrypt.compareSync(password, users[userid].hashedPassword)) {
    // email and password doesn't match, render login page with error message
    return res.status(403).render("login", { error: "Email and password doesn't match!",user:{id: undefined} });
  }

  req.session.userId = userid;

  //Get all urls belong to user according userid
  const myUrls = urlsForUser(userid);

  //User exists, render login page with urls and user
  return res.render("urls_index", { myUrls: myUrls, user: users[userid], error:undefined});

});

app.post("/logout",(req,res) =>{

  delete req.session.userId;
  res.clearCookie('session');
  res.redirect("/login");
});

