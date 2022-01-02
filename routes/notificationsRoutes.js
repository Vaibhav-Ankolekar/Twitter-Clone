const express = require("express");
const app = express();
const router = express.Router();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require("../schemas/UserSchema");
const Chat = require("../schemas/ChatSchema");

router.get("/", (req, res, next) => {

	let payload = {
		pageTitle: "Notifications",
		userLoggedIn: req.session.user,
		userLoggedInJs: JSON.stringify(req.session.user),
	};

	res.status(200).render("notificationsPage", payload);
});

module.exports = router;
