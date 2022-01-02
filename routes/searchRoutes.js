const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const User = require("../schemas/UserSchema");

router.get("/", (req, res, next) => {

	let payload = createPayload(req.session.user);
	res.status(200).render("searchPage", payload);
});

router.get("/:selected", (req, res, next) => {

	let payload = createPayload(req.session.user);
	payload.selectedTab = req.params.selected;
	res.status(200).render("searchPage", payload);
});

const createPayload = (userLoggedIn) => {
	return {
		pageTitle: "Search",
		userLoggedIn: userLoggedIn,
		userLoggedInJs: JSON.stringify(userLoggedIn),
	};
}

module.exports = router;
