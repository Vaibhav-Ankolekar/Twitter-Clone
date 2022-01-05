const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

class Database {
    constructor() {
        this.connect();
    }

    connect() {
        mongoose.connect(process.env.MONGO_URI)
            .then(() => {
                console.log("Connection to DB successful");
            })
            .catch((err) => {
                console.log("Connection to DB error" + err);
            });
    }
}

module.exports = new Database();
