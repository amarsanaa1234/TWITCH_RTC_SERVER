const { Server } = require("socket.io");

const io = new Server(8000, {
  cors: true,
});

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();
let firstMemberSocketId = null;
let firstMemberSocketMail = null;
let secondMemberSocketId = null;
let secondMemberSocketMail = null;


io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);
  socket.on("room:join", (data) => {
    const { email, room } = data;
    if(!firstMemberSocketId){
      firstMemberSocketId = socket.id;
      firstMemberSocketMail = email;
    }else{
      secondMemberSocketId = socket.id;
      secondMemberSocketMail = email;
    }
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    io.to(room).emit("user:joined", { email, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  socket.on("message:sendMsg", (to) => {
    const {message, remoteSocketId } = to;
    console.log(to);
    console.log(secondMemberSocketId, firstMemberSocketId);
    emailToSocketIdMap.set(message, secondMemberSocketId);
    socketidToEmailMap.set(secondMemberSocketId, message);
    if(secondMemberSocketId === to.remoteSocketId){
      io.to(secondMemberSocketId).emit("user:sendMsg", { message, id: firstMemberSocketMail });

      emailToSocketIdMap.set(message, firstMemberSocketId);
      socketidToEmailMap.set(firstMemberSocketId, message);
      io.to(firstMemberSocketId).emit("user:sendMsg1", { message, id: firstMemberSocketMail });
    }else if(firstMemberSocketId === to.remoteSocketId){
      io.to(secondMemberSocketId).emit("user:sendMsg", { message, id: firstMemberSocketMail });

      emailToSocketIdMap.set(message, firstMemberSocketId);
      socketidToEmailMap.set(firstMemberSocketId, message);
      io.to(firstMemberSocketId).emit("user:sendMsg1", { message, id: firstMemberSocketMail });
    }else{
      io.to(secondMemberSocketId).emit("user:sendMsg", { message, id: secondMemberSocketMail });

      emailToSocketIdMap.set(message, firstMemberSocketId);
      socketidToEmailMap.set(firstMemberSocketId, message);
      io.to(firstMemberSocketId).emit("user:sendMsg1", { message, id: secondMemberSocketMail });
    }
    
    
  });
});