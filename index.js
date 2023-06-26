require("dotenv").config();
const app = require("express")();
const http = require("http").Server(app);
const PORT = process.env.PORT || 9111;
const cors = require("cors");
// update
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin",'*');
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, Content-Type, Accept, Authorization, X-Request-With"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});
app.use(
  cors({
    origin: '*',
  })
);
const io = require("socket.io")(http, {
  cors: {
    origin: '*',
    preflightContinue: true,
  },
});
app.get("/", function (req, res) {
  res.status(200).json({ status: "socket server is running..." });
  res.end();
});
let users = [];
const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};
const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};
const getUser = (receiverId) => {
  return users.find((user) => user.userId === parseInt(receiverId));
};
io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });
  // Send message and ge message
  socket.on("sendMessage", ({ senderId, receiverId, text, conversationId }) => {
    const user = getUser(receiverId);
    user &&
      io.to(user.socketId).emit("getMessage", {
        senderId,
        text,
        receiverId,
        conversationId,
      });
  });
  // Send suggest friend
  socket.on("sendSuggestFriend", ({ senderId, receiverId }) => {
    const user = getUser(receiverId);
    user &&
      io.to(user.socketId).emit("getSuggestFriend", { senderId, receiverId });
  });

  // confirm suggest friend

  socket.on("sendConfirmAddFriend", ({ senderId, receiverId }) => {
    const user = getUser(receiverId);
    user &&
      io
        .to(user.socketId)
        .emit("getConfirmAddFriend", { senderId, receiverId });
  });
  // send like
  socket.on("sendLike", (values) => {
    const user = getUser(values.receiverId);
    user && io.to(user.socketId).emit("getLike", values);
  });

  socket.on("disconnect", () => {
    console.log("a user disconnected");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});

http.listen(process.env.PORT || 9111, function () {
  console.log("listening on *:9111");
});
