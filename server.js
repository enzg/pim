const Koa = require("koa");
const site = require("koa-static");
const cors = require("@koa/cors");
const Config = require("./config");
const {
  userJoin,
  getRoomUsers,
  getCurrentUser,
  userLeave,
} = require("./utils/User");

const formatMessage = require("./utils/Message");
const app = new Koa();
app.use(site("client/build"));
app.use(cors());

const server = require("http").createServer(app.callback());
const io = require("socket.io")(server, {
  cors: {
    origin: Config.server,
    methods: ["GET", "POST"],
  },
});
const GM = "GM";
io.on("connection", (client) => {
  //user enter room
  client.on("joinRoom", ({ username, room }) => {
    // update users in the room
    const user = userJoin(client.id, username, room);
    client.join(user.room);
    // welcome user
    // socket.emit('message', formatMessage(GM, `欢迎[${socket.id}]`))
    // notify every others. player is entering the room
    // socket.broadcast.to(user.room).emit('message', formatMessage(GM, `[${socket.id}]进入房间`))
    //update room info and user list
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });
  // player send message; replay to everyone in the room
  client.on("chatMessage", (msg) => {
    const user = getCurrentUser(client.id);
    io.to(user.room).emit(
      "message",
      formatMessage(user.username, msg, user.id)
    );
  });
  // disconnect
  client.on("disconnect", () => {
    const user = userLeave(client.id);
    if (user) {
      // io.to(user.room).emit('message', formatMessage(GM, `[${user.id}] 离开房间`))
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});
server.listen(3333);
