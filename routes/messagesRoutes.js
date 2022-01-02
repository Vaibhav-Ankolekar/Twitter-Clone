const express = require("express");
const app = express();
const router = express.Router();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require("../schemas/UserSchema");
const Chat = require("../schemas/ChatSchema");

router.get("/", (req, res, next) => {

	let payload = {
		pageTitle: "Inbox",
		userLoggedIn: req.session.user,
		userLoggedInJs: JSON.stringify(req.session.user),
	};

	res.status(200).render("inboxPage", payload);
});

router.get("/new", (req, res, next) => {

	let payload = {
		pageTitle: "New Message",
		userLoggedIn: req.session.user,
		userLoggedInJs: JSON.stringify(req.session.user),
	};

	res.status(200).render("newMessage", payload);
});

router.get("/:chatId", async (req, res, next) => {

	let userId = req.session.user._id;
	let chatId = req.params.chatId;

	let isValidId = mongoose.isValidObjectId(chatId);

	let payload = {
		pageTitle: "Chat",
		userLoggedIn: req.session.user,
		userLoggedInJs: JSON.stringify(req.session.user),
	};

	if (!isValidId) {
		payload.errorMessage = "Chat do not exist or you do not have permission to view it.";
		return res.status(200).render("chatPage", payload);
	}

	let chat = await Chat.findOne({ _id: chatId, users: { $elemMatch: { $eq: userId } } })
		.populate("users");

	if (chat == null) {
		// Check if chat id is really user id
		let userFound = await User.findById(chatId);

		if (userFound != null) {
			// get chat using user id
			chat = await getChatByUserId(userFound._id, userId);
		}
	}

	if (chat == null) {
		payload.errorMessage = "Chat do not exist or you do not have permission to view it.";
	}
	else {
		payload.chat = chat;
	}

	res.status(200).render("chatPage", payload);
});

const getChatByUserId = (userLoggedInId, otherUserId) => {
	return Chat.findOneAndUpdate({
		isGroupChat: false,
		users: {
			$size: 2,
			$all: [
				{ $elemMatch: { $eq: mongoose.Types.ObjectId(userLoggedInId) } },
				{ $elemMatch: { $eq: mongoose.Types.ObjectId(otherUserId) } },
			]
		}
	},
		{
			$setOnInsert: {
				users: [userLoggedInId, otherUserId]
			}
		},
		{
			new: true,
			upsert: true
		})
		.populate("users");
}

module.exports = router;
