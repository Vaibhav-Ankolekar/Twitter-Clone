const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

class Database {
    constructor() {
        this.connect();
    }

    connect() {
        // mongoose.connect("mongodb+srv://admin:${process.env.MONGODB_API_PASSWORD}@twitterclonecluster.zqzaz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority");
        mongoose.connect(`mongodb+srv://admin:${process.env.MONGODB_API_PASSWORD}@twitterclonecluster.zqzaz.mongodb.net/TwitterCloneDB?retryWrites=true&w=majority`)
            .then(() => {
                console.log("Connection to DB successful");
            })
            .catch((err) => {
                console.log("Connection to DB error" + err);
            });
    }
}

module.exports = new Database();
