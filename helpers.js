//Get user by email, return userId
const getUserByEmail = (email,users)=>{
  for (let u in users) {
    if (users[u].email === email) return users[u].id;
  }
};
//Check if current user made this url, return true or false
const uIdForUser = (id, userid,urlDatabase) => {
  if (!urlDatabase[id]) {
    return false;
  }
  if (urlDatabase[id].userID === userid) {
    return true;
  }
  return false;
};

module.exports = {getUserByEmail,uIdForUser};