const Koa = require("koa");
const site = require("koa-static");
const cors = require("@koa/cors");
const { Config } = require("./config");
const moment = require("moment");
const {
  userJoin,
  getRoomUsers,
  getCurrentUser,
  userLeave,
  forbitUser,
} = require("./utils/User");

const formatMessage = require("./utils/Message");
const { Names } = require("./Names");
const app = new Koa();
app.use(site("client/build"));
app.use(cors());
const getName = (id) => {
  let ret = 0;
  for (const index in id) {
    ret = id.charCodeAt(index);
  }
  return Names[ret % Names.length];
};
const server = require("http").createServer(app.callback());
const io = require("socket.io")(server, {
  cors: {
    origin: Config.Endpoint,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (client) => {
  //user enter room
  client.on("joinRoom", ({ username, room, admin }) => {
    let user;
    if (moment().format("YYYYMMDD") === admin) {
      user = userJoin(client.id, getName(client.id), room, true);
    } else {
      user = userJoin(client.id, getName(client.id), room);
    }
    // update users in the room
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
    if (user) {
      if (user.canspeak) {
        io.to(user.room).emit(
          "message",
          formatMessage(user.username, msg, user.id)
        );
      } else if (!user.canspeak) {
        client.emit("message", formatMessage("GM", "您被禁言了"));
      }
    }
  });
  client.on("forbid", ({ room, user }) => {
    const owner = getCurrentUser(client.id);
    if (owner && owner.owner && owner.room === room) {
      forbitUser(user.id);
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
      client.broadcast
        .to(user.room)
        .emit(
          "message",
          formatMessage(
            owner.username,
            `${user.username} ${user.canspeak ? "被禁言" : "解除禁言"}`
          )
        );
    }
  });
  client.on("kick", ({ room, user }) => {
    const owner = getCurrentUser(client.id);
    if (owner && owner.owner && owner.room === room) {
      userLeave(user.id);
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
      client.broadcast
        .to(user.room)
        .emit(
          "message",
          formatMessage(owner.username, `${user.username} 被踢下线了`)
        );
      io.to(user.id).emit("kick", formatMessage(owner.username, "您被踢了"));
    }
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
