require("dotenv").config();
const app = require('express')();
const http = require('http').Server(app);
const PORT = process.env.PORT || 9111;
// app.use(function (req, res, next) {
//     // Website you wish to allow to connect
//     res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
//     // Request methods you wish to allow
//     res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

//     // Request headers you wish to allow
//     res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Request-With');
//     // Set to true if you need the website to include cookies in the requests sent
//     // to the API (e.g. in case you use sessions)
//     res.header('Access-Control-Allow-Credentials', true);
//     // Pass to next layer of middleware
//     // res.setHeader('Content-Type', 'application/json; charset=utf-8');
//     next();
//   });


const io = require("socket.io")(http, {
    cors: {
      origin: "http://localhost:3000",
    }
})

app.get('/', function(req, res) {
  res.status(200).json({status: 'socket server is running...'});
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
  return users.find((user) => user.userId === receiverId);
};
io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });
  // Send message and ge message
  socket.on("sendMessage", ({ senderId, receiverId, text ,conversationId   } ) => {
    const user = getUser(receiverId);
    user &&
      io.to(user.socketId).emit("getMessage", {
        senderId,
        text,
        receiverId,
        conversationId,
      });
  });
  socket.on("disconnect", () => {
    console.log("a user disconnected");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});




http.listen(process.env.PORT || 9111, function() {
  console.log('listening on *:9111');
});