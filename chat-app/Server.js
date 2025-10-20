const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const activeUsers = new Map(); // åå‰ â†’ socket.id
const userIcons = new Map();   // åå‰ â†’ ã‚¢ã‚¤ã‚³ãƒ³ID
const bannedUsers = new Set();

function getRandomIcon() {
  const icons = ["ðŸ±", "ðŸ¶", "ðŸ§", "ðŸ¸", "ðŸ¦Š", "ðŸ¼", "ðŸ°", "ðŸŸ"];
  return icons[Math.floor(Math.random() * icons.length)];
}

io.on('connection', (socket) => {
  let nickname = "";

  socket.on("set nickname", (name) => {
    if (activeUsers.has(name) || bannedUsers.has(name)) {
      socket.emit("nickname rejected");
    } else {
      nickname = name;
      activeUsers.set(nickname, socket.id);
      userIcons.set(nickname, getRandomIcon());
      socket.emit("nickname accepted", userIcons.get(nickname));
    }
  });

  socket.on("chat message", ({ nickname, message }) => {
    if (bannedUsers.has(nickname)) {
      socket.emit("banned");
      return;
    }

    if (nickname === "admin" && message.startsWith("/ban ")) {
      const target = message.split(" ")[1];
      bannedUsers.add(target);
      io.emit("chat message", {
        nickname: "system",
        icon: "ðŸš«",
        message: `${target} ã¯BANã•ã‚Œã¾ã—ãŸã€‚`
      });
      return;
    }

    io.emit("chat message", {
      nickname,
      icon: userIcons.get(nickname),
      message
    });
  });

  socket.on("disconnect", () => {
    activeUsers.delete(nickname);
    userIcons.delete(nickname);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`ã‚µãƒ¼ãƒãƒ¼èµ·å‹•ä¸­ï¼ãƒãƒ¼ãƒˆ: ${PORT}`);
});
