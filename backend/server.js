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

// Import Firebase auth middleware and user service
const authMiddleware = require("./authMiddleware");
const { getOrCreateUser } = require("./userService");

const app = express();

// Enhanced CORS configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json());

// Request logging middleware for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

const db = new DynamoDBClient({
    region: process.env.AWS_REGION,
});

// Root check
app.get("/", (req, res) => {
    res.send("Backend running with Firebase Authentication");
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

// Protected test route - requires Firebase authentication
app.get("/api/protected", authMiddleware, (req, res) => {
    res.json({
        message: "Access granted",
        uid: req.user.uid,
        email: req.user.email,
    });
});

/* =========================
   USERS
========================= */

// ➕ Create user (legacy endpoint - kept for backward compatibility)
// Note: Users are now auto-created on first login via Firebase
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
   LISTS (Protected Routes)
========================= */

// ➕ Create list - PROTECTED ROUTE
// Requires Firebase authentication
// ownerId is automatically set from Firebase UID
app.post("/lists", authMiddleware, async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: "name is required" });
    }

    try {
        // Get or create user in DynamoDB using Firebase UID
        const user = await getOrCreateUser(req.user.uid, req.user.email);

        // Create list with Firebase UID as ownerId
        const list = {
            listId: crypto.randomUUID(),
            ownerId: req.user.uid, // Use Firebase UID, not from request body
            name,
            createdAt: new Date().toISOString(),
        };

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

// 🔍 Get lists for a specific user - PROTECTED ROUTE
app.get("/lists/user/:userId", authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;

        // Verify the requesting user is asking for their own lists
        if (req.user.uid !== userId) {
            return res.status(403).json({
                error: "Forbidden: You can only access your own lists"
            });
        }

        // Query DynamoDB for lists owned by this user
        const command = new ScanCommand({
            TableName: "Lists",
            FilterExpression: "ownerId = :ownerId",
            ExpressionAttributeValues: {
                ":ownerId": userId,
            },
        });

        const result = await db.send(command);
        res.json(result.Items || []);
    } catch (err) {
        console.error("GET LISTS ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/debug-routes", (req, res) => {
    res.json({
        routes: [
            "GET / - Health check",
            "GET /test-db - Test database connection",
            "GET /api/protected - Test protected route (requires auth)",
            "POST /users - Create user (legacy)",
            "GET /users/:userId - Get user by ID",
            "POST /lists - Create list (protected - requires Firebase auth)",
            "GET /lists/user/:userId - Get user's lists (protected - requires Firebase auth)"
        ]
    });
});


app.listen(5000, () => {
    console.log("Server running on port 5000 with Firebase Authentication");
});
