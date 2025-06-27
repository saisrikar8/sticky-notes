const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { verifyCookie, hashPassword, verifyPassword, createJwtToken } = require("./utils");
const { jwtDecode } = require("jwt-decode");
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const mongodb_URL = `mongodb+srv://tummalasaisrikar:${process.env.MONGODB_PASSWORD}@yichangs-temu-storage.irg9scu.mongodb.net/?retryWrites=true&w=majority&appName=YICHANGS-TEMU-STORAGE`;
const dbclient = new MongoClient(mongodb_URL, { serverApi: ServerApiVersion.v1 });
const stickiesCollection = dbclient.db("sticky-notes-game").collection("stickies");
const groupsCollection = dbclient.db("sticky-notes-game").collection("groups");
const usersCollection = dbclient.db("sticky-notes-game").collection("users");

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'), { headers: { 'Content-Type': 'text/html' } });
});

app.post("/api/register", async (req, res) => {
    const email = req.body.email.trim();
    const password = req.body.password.trim();

    if (!email.includes("@")) {
        return res.status(401).json({ status: "error", message: "That doesn't seem like a valid email. Please try again" });
    }
    if (password.length <= 2) {
        return res.status(401).json({ status: "error", message: "Your password is too short. Please make it longer" });
    }

    const existingAccount = await usersCollection.findOne({ email });
    if (existingAccount) {
        return res.status(401).json({ status: "error", message: "Account already exists, please log in" });
    }

    const hashed = await hashPassword(password);
    await usersCollection.insertOne({ email, password: hashed, createdAt: new Date(), groups: [] });
    const insertedUser = await usersCollection.findOne({ email });
    const token = createJwtToken({ email, uuid: insertedUser._id.toString() });

    res.cookie('token', token, { httpOnly: true, sameSite: 'Strict', maxAge: 3600000 });
    res.cookie('user', insertedUser._id.toString(), { httpOnly: true, sameSite: 'Strict', maxAge: 3600000 });

    return res.json({ status: "success", message: "Your account was successfully created", token, exp: jwtDecode(token).exp });
});

app.post('/api/create-group', verifyCookie, async (req, res) => {
    const { name } = req.body;
    const result = await groupsCollection.insertOne({ name, stickies: [] });
    await usersCollection.updateOne(
        { _id: req.user._id },
        { $push: { groups: result.insertedId } }
    );
    res.status(200).json({ groupId: result.insertedId });
});


app.post("/api/login", async (req, res) => {
    const email = req.body.email.trim();
    const password = req.body.password.trim();

    const user = await usersCollection.findOne({ email });
    if (!user) {
        return res.status(401).json({ status: "error", message: "Incorrect username or password" });
    }

    const isCorrectPassword = await verifyPassword(password, user.password);
    if (!isCorrectPassword) {
        return res.status(401).json({ status: "error", message: "Incorrect username or password" });
    }

    const token = createJwtToken({ email, _id: user._id.toString() });
    res.cookie('token', token, { httpOnly: true, sameSite: 'Strict', maxAge: 3600000 });
    res.cookie('user', user._id.toString(), { httpOnly: true, sameSite: 'Strict', maxAge: 3600000 });

    return res.json({ status: "success", message: "Welcome back! We're logging you in right now", token, exp: jwtDecode(token).exp });
});

app.post('/api/get-stickies', verifyCookie, async (req, res) => {
    try {
        const userGroups = req.user.groups || [];
        const groups = await groupsCollection.find({ _id: { $in: userGroups.map(id => new ObjectId(id)) } }).toArray();
        const stickyIds = groups.flatMap(g => g.stickies || []).map(id => new ObjectId(id));
        const stickies = await stickiesCollection.find({ _id: { $in: stickyIds } }).toArray();
        res.status(200).json(stickies);
    } catch (e) {
        console.error("Error getting stickies:", e);
        res.status(500).json({ error: "Failed to fetch stickies" });
    }
});

app.post('/api/post-sticky', verifyCookie, async (req, res) => {
    try {
        const { title, text, color, groupId } = req.body;
        const stickyData = { title, text, color };
        const result = await stickiesCollection.insertOne(stickyData);
        const stickyId = result.insertedId;

        await groupsCollection.updateOne({ _id: new ObjectId(groupId) }, { $push: { stickies: stickyId } });

        return res.status(200).json({ id: stickyId });
    } catch (e) {
        console.error("Error posting sticky:", e);
        return res.status(500).json({ error: "Error posting sticky" });
    }
});

app.post('/api/remove-sticky', verifyCookie, async (req, res) => {
    try {
        const stickyId = new ObjectId(req.body.id);
        await stickiesCollection.deleteOne({ _id: stickyId });
        await groupsCollection.updateMany({}, { $pull: { stickies: stickyId } });
        return res.sendStatus(200);
    } catch (e) {
        console.error("Error removing sticky:", e);
        return res.sendStatus(500);
    }
});

app.post('/api/group/add-sticky', verifyCookie, async (req, res) => {
    try {
        const { groupId, stickyId } = req.body;
        await groupsCollection.updateOne(
            { _id: new ObjectId(groupId) },
            { $addToSet: { stickies: new ObjectId(stickyId) } }  // $addToSet prevents duplicates
        );
        res.status(200).json({ status: "success", message: "Sticky added to group" });
    } catch (e) {
        console.error("Error adding sticky to group:", e);
        res.status(500).json({ status: "error", message: "Failed to add sticky to group" });
    }
});

app.post('/api/group/remove-sticky', verifyCookie, async (req, res) => {
    try {
        const { groupId, stickyId } = req.body;
        await groupsCollection.updateOne(
            { _id: new ObjectId(groupId) },
            { $pull: { stickies: new ObjectId(stickyId) } }
        );
        res.status(200).json({ status: "success", message: "Sticky removed from group" });
    } catch (e) {
        console.error("Error removing sticky from group:", e);
        res.status(500).json({ status: "error", message: "Failed to remove sticky from group" });
    }
});


app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
