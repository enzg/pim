// const redis = require("redis");
// const rds = redis.createClient();

const users = [];

// Join user to chat
function userJoin(id, username, room, isAdmin = false) {
  const user = { id, username, room, canspeak: true };
  // rds.set("users", JSON.stringify(users));
  // rds.set(`${id}`, username);
  if (isAdmin) {
    user.owner = true;
  }
  users.push(user);
  return user;
}
function forbitUser(id) {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    users[index].canspeak = !users[index].canspeak;
  }
}
// Get current user
function getCurrentUser(id) {
  // use id to get username
  return users.find((user) => user.id === id);
}

// User leaves chat
function userLeave(id) {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    const leavedUser = users.splice(index, 1)[0];
    //rds.set("users", JSON.stringify(users));
    return leavedUser;
  }
}

// Get room users
function getRoomUsers(room) {
  return users.filter((user) => user.room === room);
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  forbitUser,
};
