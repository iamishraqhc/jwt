require("dotenv").config()
require('./config/database').connect()
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken");

const User = require('./model/user')
const auth = require('./middleware/auth')

const app = express()

app.use(express.json())

app.post('/welcome', auth, (req, res) => {
    res.status(200).send("Welcome!!")
})

app.post('/register', async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body

        if (!(email && password && firstname && lastname)) {
            res.status(400).send("All inputs are required.")
        }

        const oldUser = await User.findOne({ email })

        if (oldUser) {
            return res.status(409).send("User already exists. Please login")
        }

        encryptedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            firstname,
            lastname,
            email: email.toLowerCase(),
            password: encryptedPassword,
        })

        const token = jwt.sign(
            { user_id: user._id, email },
            process.env.TOKEN_KEY,
            {
                expiresIn: "2h",
            }
        )

        user.token = token
        res.status(201).json(user)
    } 
    catch (err) {
        console.error(err)
    }
})

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        if (!(email && password)) {
            res.status(400).send("All inputs are required")
        }

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { user_id: user._id, email },
                process.env.TOKEN_KEY,
                {
                    expiresIn: '2h',
                }
            )

            user.token = token
            res.status(200).json(user)
        }
        res.status(400).send("Invalid Credentials")
    }
    catch (err) {
        console.error(err)
    }
})

module.exports = app
