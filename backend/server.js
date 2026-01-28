const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    ScanCommand,
    PutCommand,
    GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

const db = new DynamoDBClient({
    region: process.env.AWS_REGION,
});

// Root check
app.get("/", (req, res) => {
    res.send("Backend running");
});

// 🔎 Test DB
app.get("/test-db", async (req, res) => {
    try {
        const command = new ScanCommand({ TableName: "Users" });
        const data = await db.send(command);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   USERS
========================= */

// ➕ Create user
app.post("/users", async (req, res) => {
    const { username, email } = req.body;

    if (!username || !email) {
        return res.status(400).json({ error: "username and email required" });
    }

    const user = {
        userId: uuidv4(),
        username,
        email,
        createdAt: new Date().toISOString(),
    };

    try {
        await db.send(
            new PutCommand({
                TableName: "Users",
                Item: user,
            })
        );

        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔍 Get user by ID
app.get("/users/:userId", async (req, res) => {
    try {
        const result = await db.send(
            new GetCommand({
                TableName: "Users",
                Key: { userId: req.params.userId },
            })
        );

        if (!result.Item) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(result.Item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   LISTS
========================= */

app.post("/lists", async (req, res) => {
    const { ownerId, name } = req.body;

    if (!ownerId || !name) {
        return res.status(400).json({ error: "ownerId and name required" });
    }

    const list = {
        listId: crypto.randomUUID(),
        ownerId,
        name,
        createdAt: new Date().toISOString(),
    };

    try {
        await db.send(
            new PutCommand({
                TableName: "Lists",
                Item: list,
            })
        );

        res.status(201).json(list);
    } catch (err) {
        console.error("LIST CREATE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/debug-routes", (req, res) => {
    res.json({
        routes: [
            "POST /users",
            "POST /lists"
        ]
    });
});


app.listen(5000, () => {
    console.log("Server running on port 5000");
});