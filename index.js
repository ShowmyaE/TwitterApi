const express = require('express')
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express()
app.use(express.json())
// const mongoUrl = "mongodb://localhost:27017/Twitter"
const mongoUrl = process.env.MONGO_URL
mongoose.connect(mongoUrl).then(() => {
    console.log('Connected DB')
    app.listen(5000, () => {
        console.log('Server Running at http://localhost:5000')
    })
})
    .catch((error) => {
        console.log("ERROR", error);
    })



const authentication = (request, response, next) => {
    try {
        let jwtToken
        console.log("AUTH", request.headers['authorization'])
        const authHeader = request.headers['authorization']
        if (authHeader) {
            jwtToken = authHeader.split(' ')[1]
        }
        console.log("JWT", jwtToken)

        if (jwtToken) {
            jwt.verify(jwtToken, 'SECRET_KEY', (error, payload) => {
                if (error) {
                    response.status(401)
                    response.send('Invalid JWT Token')
                } else {
                    console.log("PAYLOAD", payload.username, payload.userId)
                    request.username = payload.username,
                        request.userId = payload.userId
                    next()
                }
            })
        } else {
            response.status(401)
            response.send('Invalid JWT Token')
        }
    }
    catch (error) {
        console.log("ERROR", error)
    }
}
const userregisterSchema = new mongoose.Schema({
    username: String,
    password: String
})

const userregisterModel = mongoose.model("UserRegistration", userregisterSchema)


app.post("/signUp", async (req, res) => {
    try {
        const { username, password } = req.body
        console.log('DB value', username, password)

        const user = await userregisterModel.create({
            "username": username,
            "password": password
        });

        const insertData = await user.save();
        console.log("INSET", insertData);
        if (insertData) {
            res.send({ data: "successfully inserted" })
        }
        else {
            res.status(400)
            res.send({ data: "Failed to inserted" })
        }
    }
    catch (error) {
        console.log("ERROR", error)
    }
})

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body
        console.log('DB value', username, password)

        // const userDbDetails = await userregisterModel.find();

        const userDbDetails = await userregisterModel.findOne({ "username": username });
        console.log(userDbDetails._id)
        if (userDbDetails) {
            const payload = { username: userDbDetails.username, userId: userDbDetails._id }
            const jwtToken = jwt.sign(payload, 'SECRET_KEY')
            res.send({ jwtToken })
        } else {
            res.status(400)
            res.send('Invalid User')
        }
    }
    catch (error) {
        console.log("ERROR", error)
    }
})

const tweetsSchema = new mongoose.Schema({
    userId: String,
    text: String,
    createdAt: Date
})

const tweetsModel = mongoose.model("Tweets", tweetsSchema)

app.post("/tweets", authentication, async (req, res) => {
    try {
        const { text } = req.body
        const { username, userId } = req
        console.log('DB value', text, username, userId)


        const user = await tweetsModel.create({
            userId: userId,
            text: text,
            createdAt: new Date()
        });
        console.log("TWEET DATA", user)
        const insertData = await user.save();
        const userDbDetails = await tweetsModel.find({});
        console.log("INSET", userDbDetails);
        if (insertData) {
            res.send({ data: "successfully inserted", insertData })
        }
        else {
            res.status(400)
            res.send({ data: "Failed to inserted" })
        }
    }
    catch (error) {
        console.log("ERROR", error)
    }
})

app.get("/api/users/:userId/timeline", authentication, async (req, res) => {
    try {
        const { userId } = req.params
        const userDbDetails = await tweetsModel.find({ userId: userId });
        console.log("USER", userDbDetails);
        if (userDbDetails.length > 0) {
            res.send(userDbDetails);
        }
        else {
            res.send({ data: "There is no post for this ID" })
        }
    }
    catch (error) {
        console.log("ERROR", error)
    }
})

