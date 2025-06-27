const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { jwtDecode } = require('jwt-decode');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require('dotenv').config();

const mongodb_URL = `mongodb+srv://tummalasaisrikar:${process.env.MONGODB_PASSWORD}@yichangs-temu-storage.irg9scu.mongodb.net/?retryWrites=true&w=majority&appName=YICHANGS-TEMU-STORAGE`;
const dbclient = new MongoClient(mongodb_URL, { serverApi: ServerApiVersion.v1 });
const usersCollection = dbclient.db("sticky-notes-game").collection("users");

async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(rawPassword, hashedPassword) {
    return await bcrypt.compare(rawPassword, hashedPassword);
}

function createJwtToken(payload) {
    return jwt.sign(payload, process.env.JWT_SIGN_KEY, {
        expiresIn: '1h',
    });
}

// Middleware: Verify auth token from cookies
async function verifyCookie(req, res, next) {
    const token = req.cookies?.token;
    const userId = req.cookies?.user;

    if (!token || !userId) {
        return res.status(401).json({ status: "error", message: 'Access denied. Missing token or user.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SIGN_KEY);
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(401).json({ status: "error", message: 'User not found.' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.log("verifyCookie error:", err);
        return res.status(401).json({ status: "error", message: 'Invalid or expired token.' });
    }
}

module.exports = {
    hashPassword,
    verifyPassword,
    createJwtToken,
    verifyCookie
};
