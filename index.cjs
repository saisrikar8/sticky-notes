const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { verifyCookie, hashPassword, verifyPassword, createJwtToken } = require("./utils.cjs");
const { jwtDecode } = require("jwt-decode");
require('dotenv').config();
const jwt = require("jsonwebtoken");
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
const fs = require('fs').promises;

const mongodb_URL = `mongodb+srv://tummalasaisrikar:${process.env.MONGODB_PASSWORD}@yichangs-temu-storage.irg9scu.mongodb.net/?retryWrites=true&w=majority&appName=YICHANGS-TEMU-STORAGE`;
const dbclient = new MongoClient(mongodb_URL, { serverApi: ServerApiVersion.v1 });
const stickiesCollection = dbclient.db("sticky-notes-game").collection("stickies");
const groupsCollection = dbclient.db("sticky-notes-game").collection("groups");
const usersCollection = dbclient.db("sticky-notes-game").collection("users");

app.get('/', async (req, res) => {
    const token = req.cookies?.token;
    const userId = req.cookies?.user;
    console.log(token);
    console.log(userId);

    if (!token && !userId) {
        console.log("going login")
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SIGN_KEY);
        console.log(decoded);
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        console.log(user);

        if (!user) {
            return res.redirect('/login');
        }

        res.sendFile(path.join(__dirname, 'public', 'mainscreen', 'mainscreen.html'), {
            headers: { 'Content-Type': 'text/html' }
        });
    } catch (err) {
        console.log(err);
        return res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'onboarding', 'login.html'));
});
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'onboarding', 'register.html'));
});
app.get('/scene/:groupId', verifyCookie, async (req, res) => {
    const groupId = req.params.groupId;
    console.log(req.user);
    if (!req.user.groups.map(id => id.toString()).includes(groupId)) {
        return res.status(401).json({ message: "You are not allowed to access this group" });
    }
    res.sendFile(path.join(__dirname, 'public', 'scene-controller', 'scene-controller.html'));
})

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

app.get("/api/get-avaliable-scenes", async (req, res) => {
    try {
        const scenesDir = path.join(__dirname, 'public/scenes');
        const files = await fs.readdir(scenesDir);

        const sceneNames = files
            .filter(file => file.endsWith('.png'))
            .map(file => path.basename(file, '.png'));

        res.json(sceneNames);
    } catch (error) {
        console.error('Error reading scenes directory:', error);
        res.status(500).json({ error: 'Could not read scenes directory' });
    }
});

app.get('/api/get-joined-groups', verifyCookie, async (req, res) => {
    const user = req.user;
    const friendly = [];

    for (const groupId of user.groups) {
        const groupDetails = await groupsCollection.findOne({ _id: groupId });
        if (!groupDetails) {
            friendly.push({ name: "unknown group", id: -1, image: "undefined" });
            continue;
        }
        friendly.push({ name: groupDetails.name, id: groupId.toString(), image: groupDetails.image });
    }

    console.log(friendly);
    return res.json(friendly);
})

app.post('/api/create-group', verifyCookie, async (req, res) => {
    console.log("-------");
    console.log(req.decoded);
    console.log(req.user);
    console.log("here is req body");
    console.log(req.body);
    const name = req.body.name;
    const image = req.body.image;
    const result = await groupsCollection.insertOne({ name, image, stickies: [] });
    await usersCollection.updateOne(
        { _id: req.user._id },
        { $push: { groups: result.insertedId } }
    );
    res.status(200).json({ groupId: result.insertedId });
});

app.post('/api/update-sticky-size', verifyCookie, async (req, res) => {
    try {
        const { id, width, height } = req.body;
        if (!id || !width || !height) {
            return res.status(400).json({ status: "error", message: "Missing id, width, or height" });
        }

        const result = await stickiesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { width, height } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ status: "error", message: "Sticky note not found" });
        }

        res.status(200).json({ status: "success", message: "Sticky size updated" });
    } catch (e) {
        console.error("Error updating sticky size:", e);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});

app.post('/api/update-sticky-position', verifyCookie, async (req, res) => {
    try {
        const { id, x, y } = req.body;
        if (!id || typeof x !== 'number' || typeof y !== 'number') {
            return res.status(400).json({ status: "error", message: "Missing or invalid id, x, or y" });
        }

        const result = await stickiesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { x, y } }
        );

        if (result.matchedCount === 0) {
            stickiesCollection.updateOne({_id: new ObjectId(id)}, { $set: { x: x, y: y } });
        }

        res.status(200).json({ status: "success", message: "Sticky position updated" });
    } catch (e) {
        console.error("Error updating sticky position:", e);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});

app.post('/api/get-stickies', verifyCookie, async (req, res) => {
    try {
        const jwt = req.cookies.token
        const decoded = jwtDecode(jwt)
        const email = decoded.email
        const user = await usersCollection.findOne({ email })
        const userGroups = user.groups || [];
        const groups = await groupsCollection.find({ _id: { $in: userGroups.map(id => new ObjectId(id)) } }).toArray();
        const stickyIds = groups.flatMap(g => g.stickies || []).map(id => new ObjectId(id));
        const stickies = await stickiesCollection.find({ _id: { $in: stickyIds } }).toArray();
        console.log(stickies)
        return res.status(200).json(stickies);
    } catch (e) {
        console.error("Error getting stickies:", e);
        return res.status(500).json({ error: "Failed to fetch stickies" });
    }
});

app.post('/api/post-sticky', verifyCookie, async (req, res) => {
    try {
        const { title, text, color, groupId, x, y, width, height } = req.body;
        const stickyData = { title, text, color, groupId, x, y, width, height };
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

app.post('/api/update-sticky-text', verifyCookie, async (req, res) => {
    const { id, title, text } = req.body;
    console.log(id)
    const result = await stickiesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { title, text } }
    );
    console.log(result)
    res.json({ status: "ok", modified: result.modifiedCount });
});

app.post('/api/add-person-to-group', verifyCookie, async (req, res) => {
    try {
        const { email, groupId } = req.body;

        if (!email || !groupId) {
            return res.status(400).json({ status: "error", message: "Missing email or groupId" });
        }

        // Find the user by email
        const userToAdd = await usersCollection.findOne({ email });
        if (!userToAdd) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        // Check if the current user has access to the group
        const currentUser = req.user;
        if (!currentUser.groups.some(id => id.toString() === groupId)) {
            return res.status(403).json({ status: "error", message: "You don't have permission to add users to this group" });
        }

        // Check if the user is already in the group
        if (userToAdd.groups && userToAdd.groups.some(id => id.toString() === groupId)) {
            return res.status(400).json({ status: "error", message: "User is already a member of this group" });
        }

        // Add the group to the user's groups
        await usersCollection.updateOne(
            { _id: userToAdd._id },
            { $addToSet: { groups: new ObjectId(groupId) } }
        );

        res.status(200).json({ status: "success", message: "User added to group successfully" });
    } catch (error) {
        console.error("Error adding person to group:", error);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});


app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
