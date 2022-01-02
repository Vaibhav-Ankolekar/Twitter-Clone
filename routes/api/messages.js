const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const User = require("../../schemas/UserSchema");
const Post = require("../../schemas/PostSchema");
const Chat = require("../../schemas/ChatSchema");
const Message = require("../../schemas/MessageSchema");
const Notification = require("../../schemas/NotificationSchema");

app.use(bodyParser.urlencoded({ extended: false }));

router.post("/", async (req, res, next) => {
    if (!req.body.content || !req.body.chatId) {
        console.log("Request data is empty");
        return res.sendStatus(400);
    }

    let newMessage = {
        sender: req.session.user._id,
        content: req.body.content,
        chat: req.body.chatId,
    };

    Message.create(newMessage)
        .then(async (message) => {
            message = await Message.populate(message, { path: "sender" });
            message = await Message.populate(message, { path: "chat" });
            message = await User.populate(message, { path: "chat.users" });

            let chat = await Chat.findByIdAndUpdate(req.body.chatId, {
                latestMessage: message,
            }).catch((error) => {
                console.log(error);
            });

            insertNotification(chat, message);

            res.status(201).send(message);
        })
        .catch((error) => {
            console.log(error);
            res.sendStatus(400);
        });
});

const insertNotification = (chat, message) => {
    chat.users.forEach((userId) => {
        if (userId == message.sender._id.toString()) return;
        Notification.insertNotification(
            userId,
            message.sender._id,
            "newMessage",
            message.chat._id
        );
    });
};

module.exports = router;
