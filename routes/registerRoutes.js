const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const User = require("../schemas/UserSchema");
const bcrypt = require("bcrypt");

app.set("view engine", "pug");
app.set("views", "views");
app.use(bodyParser.urlencoded({ extended: false }));

router.get("/", (req, res, next) => {
    res.status(200).render("register");
});

router.post("/", async (req, res, next) => {
    const firstName = req.body.firstName.trim();
    const lastName = req.body.lastName.trim();
    const username = req.body.username.trim();
    const email = req.body.email.trim();
    const password = req.body.password;

    const payload = req.body;

    if (firstName && lastName && username && email && password) {
        const user = await User.findOne({
            $or: [{ username: username }, { email: email }],
        }).catch((error) => {
            console.log(error);
            payload.errorMessage = "Something went wrong.";
            res.status(200).render("register", payload);
        });

        if (user == null) {
            // No user found
            const data = req.body;
            data.password = await bcrypt.hash(password, 10);
            User.create(data).then((user) => {
                req.session.user = user;
                return res.redirect("/");
            });
        } else {
            //User found
            if (email == user.username) {
                payload.errorMessage = "Username already in use";
            } else {
                payload.errorMessage = "Email already in use";
            }
            res.status(200).render("register", payload);
        }
    } else {
        payload.errorMessage = "Make sure each field have valid value";
        res.status(200).render("register", payload);
    }
});

module.exports = router;
