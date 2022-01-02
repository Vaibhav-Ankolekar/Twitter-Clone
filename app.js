const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const middleware = require("./middleware");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("./database");
const session = require("express-session");

const server = app.listen(port, () => console.log("Server listening on port", port, "..."));
const io = require("socket.io")(server, { pingTimeout: 60000 });

app.set("view engine", "pug");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({ secret: "secret123", resave: true, saveUninitialized: false }));

// Template routes
const registerRoutes = require("./routes/registerRoutes");
const loginRoutes = require("./routes/loginRoutes");
const logoutRoutes = require("./routes/logoutRoutes");
const postRoutes = require("./routes/postRoutes");
const profileRoutes = require("./routes/profileRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const searchRoutes = require("./routes/searchRoutes");
const messagesRoute = require("./routes/messagesRoutes");
const notificationsRoute = require("./routes/notificationsRoutes");

app.use("/register", registerRoutes);
app.use("/login", loginRoutes);
app.use("/logout", logoutRoutes);
app.use("/post", middleware.requireLogin, postRoutes);
app.use("/profile", middleware.requireLogin, profileRoutes);
app.use("/uploads", uploadRoutes);
app.use("/search", middleware.requireLogin, searchRoutes);
app.use("/messages", middleware.requireLogin, messagesRoute);
app.use("/notifications", middleware.requireLogin, notificationsRoute);

// API routes
const postsApiRoutes = require("./routes/api/posts");
const usersApiRoutes = require("./routes/api/users");
const chatsApiRoutes = require("./routes/api/chats");
const messagesApiRoutes = require("./routes/api/messages");
const notificationsApiRoutes = require("./routes/api/notifications");

app.use("/api/posts", postsApiRoutes);
app.use("/api/users", usersApiRoutes);
app.use("/api/chats", chatsApiRoutes);
app.use("/api/messages", messagesApiRoutes);
app.use("/api/notifications", notificationsApiRoutes);

app.get("/", middleware.requireLogin, (req, res, next) => {
    var payload = {
        pageTitle: "Home",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
    };

    res.status(200).render("home", payload);
});

io.on("connection", (socket) => {
    socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected");
    });

    socket.on("join room", (room) => socket.join(room));
    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
    socket.on("notification received", (room) => socket.in(room).emit("notification received"));

    socket.on("new message", (newMessage) => {
        let chat = newMessage.chat;

        if (!chat.users) return console.log("chat.users not defined");

        chat.users.forEach((user) => {
            if (user._id == newMessage.sender._id) return;
            socket.in(user._id).emit("message received", newMessage);
        });
    });

});
