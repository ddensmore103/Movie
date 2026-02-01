const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    ScanCommand,
    PutCommand,
    GetCommand,
    DeleteCommand,
    QueryCommand,
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

// ➕ Create user (auto-called on first Firebase login)
app.post("/users", async (req, res) => {
    const { userId, username, email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "email is required" });
    }

    // Use provided userId (from Firebase) or generate new one
    const finalUserId = userId || uuidv4();

    try {
        // Check if user already exists
        const existingUser = await db.send(
            new GetCommand({
                TableName: "Users",
                Key: { userId: finalUserId },
            })
        );

        if (existingUser.Item) {
            // User already exists, return existing user
            return res.status(200).json(existingUser.Item);
        }

        // Create new user
        const user = {
            userId: finalUserId,
            username: username || email.split('@')[0],
            email,
            createdAt: new Date().toISOString(),
        };

        await db.send(
            new PutCommand({
                TableName: "Users",
                Item: user,
            })
        );

        res.status(201).json(user);
    } catch (err) {
        console.error("CREATE USER ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   USER SEARCH
========================= */

// 🔍 Search users - PROTECTED ROUTE
// IMPORTANT: This must be defined BEFORE /users/:userId to avoid route conflicts
app.get("/users/search", authMiddleware, async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json([]);
        }

        const searchQuery = q.toLowerCase().trim();

        // Scan Users table for matches
        const command = new ScanCommand({
            TableName: "Users",
        });

        const result = await db.send(command);
        const users = result.Items || [];

        // Filter users by username or email (case-insensitive)
        // Exclude current user
        const filteredUsers = users.filter(user => {
            if (user.userId === req.user.uid) return false;

            const username = (user.username || "").toLowerCase();
            const email = (user.email || "").toLowerCase();

            return username.includes(searchQuery) || email.includes(searchQuery);
        });

        // Return limited results
        res.json(filteredUsers.slice(0, 10));
    } catch (err) {
        console.error("USER SEARCH ERROR:", err);
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
        const lists = result.Items || [];

        // For each list, fetch the movies
        const listsWithMovies = await Promise.all(
            lists.map(async (list) => {
                try {
                    const moviesResult = await db.send(
                        new QueryCommand({
                            TableName: "ListMovies",
                            KeyConditionExpression: "listId = :listId",
                            ExpressionAttributeValues: {
                                ":listId": list.listId,
                            },
                        })
                    );

                    return {
                        ...list,
                        movies: moviesResult.Items || [],
                    };
                } catch (err) {
                    console.error(`Error fetching movies for list ${list.listId}:`, err);
                    return {
                        ...list,
                        movies: [],
                    };
                }
            })
        );

        res.json(listsWithMovies);
    } catch (err) {
        console.error("GET LISTS ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// 🔍 Get list by ID with movies - PROTECTED ROUTE
app.get("/lists/:listId", authMiddleware, async (req, res) => {
    try {
        const { listId } = req.params;

        // Get the list details
        const listResult = await db.send(
            new GetCommand({
                TableName: "Lists",
                Key: { listId },
            })
        );

        if (!listResult.Item) {
            return res.status(404).json({ error: "List not found" });
        }

        // Verify the requesting user owns this list
        if (req.user.uid !== listResult.Item.ownerId) {
            return res.status(403).json({
                error: "Forbidden: You can only access your own lists"
            });
        }

        // Get all movies in this list
        const moviesResult = await db.send(
            new QueryCommand({
                TableName: "ListMovies",
                KeyConditionExpression: "listId = :listId",
                ExpressionAttributeValues: {
                    ":listId": listId,
                },
            })
        );

        res.json({
            ...listResult.Item,
            movies: moviesResult.Items || [],
        });
    } catch (err) {
        console.error("GET LIST ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// 🗑️ Delete list - PROTECTED ROUTE
app.delete("/lists/:listId", authMiddleware, async (req, res) => {
    try {
        const { listId } = req.params;

        // Get the list to verify ownership
        const listResult = await db.send(
            new GetCommand({
                TableName: "Lists",
                Key: { listId },
            })
        );

        if (!listResult.Item) {
            return res.status(404).json({ error: "List not found" });
        }

        // Verify the requesting user owns this list
        if (req.user.uid !== listResult.Item.ownerId) {
            return res.status(403).json({
                error: "Forbidden: You can only delete your own lists"
            });
        }

        // Delete all movies in the list first
        const moviesResult = await db.send(
            new QueryCommand({
                TableName: "ListMovies",
                KeyConditionExpression: "listId = :listId",
                ExpressionAttributeValues: {
                    ":listId": listId,
                },
            })
        );

        // Delete each movie entry
        for (const movie of moviesResult.Items || []) {
            await db.send(
                new DeleteCommand({
                    TableName: "ListMovies",
                    Key: {
                        listId: movie.listId,
                        movieId: movie.movieId,
                    },
                })
            );
        }

        // Delete the list itself
        await db.send(
            new DeleteCommand({
                TableName: "Lists",
                Key: { listId },
            })
        );

        res.json({ message: "List deleted successfully" });
    } catch (err) {
        console.error("DELETE LIST ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// ➕ Add movie to list - PROTECTED ROUTE
app.post("/lists/:listId/movies", authMiddleware, async (req, res) => {
    try {
        const { listId } = req.params;
        const { tmdbId, title, posterPath, releaseDate, rating } = req.body;

        if (!tmdbId || !title) {
            return res.status(400).json({ error: "tmdbId and title are required" });
        }

        // Verify the list exists and user owns it
        const listResult = await db.send(
            new GetCommand({
                TableName: "Lists",
                Key: { listId },
            })
        );

        if (!listResult.Item) {
            return res.status(404).json({ error: "List not found" });
        }

        if (req.user.uid !== listResult.Item.ownerId) {
            return res.status(403).json({
                error: "Forbidden: You can only add movies to your own lists"
            });
        }

        // Create the list-movie entry
        const movieId = crypto.randomUUID();
        const listMovie = {
            listId,
            movieId,
            tmdbId,
            title,
            posterPath: posterPath || null,
            releaseDate: releaseDate || null,
            rating: rating || null,
            addedAt: new Date().toISOString(),
        };

        await db.send(
            new PutCommand({
                TableName: "ListMovies",
                Item: listMovie,
            })
        );

        res.status(201).json(listMovie);
    } catch (err) {
        console.error("ADD MOVIE TO LIST ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// 🗑️ Remove movie from list - PROTECTED ROUTE
app.delete("/lists/:listId/movies/:movieId", authMiddleware, async (req, res) => {
    try {
        const { listId, movieId } = req.params;

        // Verify the list exists and user owns it
        const listResult = await db.send(
            new GetCommand({
                TableName: "Lists",
                Key: { listId },
            })
        );

        if (!listResult.Item) {
            return res.status(404).json({ error: "List not found" });
        }

        if (req.user.uid !== listResult.Item.ownerId) {
            return res.status(403).json({
                error: "Forbidden: You can only remove movies from your own lists"
            });
        }

        // Delete the movie from the list
        await db.send(
            new DeleteCommand({
                TableName: "ListMovies",
                Key: {
                    listId,
                    movieId,
                },
            })
        );

        res.json({ message: "Movie removed from list successfully" });
    } catch (err) {
        console.error("REMOVE MOVIE FROM LIST ERROR:", err);
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



/* =========================
   FRIEND REQUESTS
========================= */

// ➕ Send friend request - PROTECTED ROUTE
app.post("/friend-requests", authMiddleware, async (req, res) => {
    try {
        const { toUserId } = req.body;

        if (!toUserId) {
            return res.status(400).json({ error: "toUserId is required" });
        }

        // Can't send request to yourself
        if (toUserId === req.user.uid) {
            return res.status(400).json({ error: "Cannot send friend request to yourself" });
        }

        // Check if request already exists
        const existingCommand = new ScanCommand({
            TableName: "FriendRequests",
            FilterExpression: "fromUserId = :fromUserId AND toUserId = :toUserId AND #status = :status",
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: {
                ":fromUserId": req.user.uid,
                ":toUserId": toUserId,
                ":status": "PENDING"
            },
        });

        const existingResult = await db.send(existingCommand);
        if (existingResult.Items && existingResult.Items.length > 0) {
            return res.status(400).json({ error: "Friend request already sent" });
        }

        // Check if already friends
        const friendshipCheck = await db.send(
            new GetCommand({
                TableName: "Friendships",
                Key: {
                    userId: req.user.uid,
                    friendId: toUserId
                }
            })
        );

        if (friendshipCheck.Item) {
            return res.status(400).json({ error: "Already friends with this user" });
        }

        // Create friend request
        const friendRequest = {
            requestId: crypto.randomUUID(),
            fromUserId: req.user.uid,
            toUserId,
            status: "PENDING",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await db.send(
            new PutCommand({
                TableName: "FriendRequests",
                Item: friendRequest,
            })
        );

        res.status(201).json(friendRequest);
    } catch (err) {
        console.error("SEND FRIEND REQUEST ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// 🔍 Get pending friend requests - PROTECTED ROUTE
app.get("/friend-requests/pending", authMiddleware, async (req, res) => {
    try {
        const command = new QueryCommand({
            TableName: "FriendRequests",
            IndexName: "toUserId-status-index",
            KeyConditionExpression: "toUserId = :toUserId AND #status = :status",
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: {
                ":toUserId": req.user.uid,
                ":status": "PENDING",
            },
        });

        const result = await db.send(command);
        const requests = result.Items || [];

        // Fetch user details for each request
        const requestsWithUserDetails = await Promise.all(
            requests.map(async (request) => {
                try {
                    const userResult = await db.send(
                        new GetCommand({
                            TableName: "Users",
                            Key: { userId: request.fromUserId },
                        })
                    );

                    return {
                        ...request,
                        fromUser: userResult.Item || null,
                    };
                } catch (err) {
                    console.error(`Error fetching user ${request.fromUserId}:`, err);
                    return {
                        ...request,
                        fromUser: null,
                    };
                }
            })
        );

        res.json(requestsWithUserDetails);
    } catch (err) {
        console.error("GET PENDING REQUESTS ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Accept friend request - PROTECTED ROUTE
app.put("/friend-requests/:requestId/accept", authMiddleware, async (req, res) => {
    try {
        const { requestId } = req.params;

        // Get the request
        const requestResult = await db.send(
            new GetCommand({
                TableName: "FriendRequests",
                Key: { requestId },
            })
        );

        if (!requestResult.Item) {
            return res.status(404).json({ error: "Friend request not found" });
        }

        const request = requestResult.Item;

        // Verify the current user is the recipient
        if (request.toUserId !== req.user.uid) {
            return res.status(403).json({ error: "Forbidden" });
        }

        // Update request status
        await db.send(
            new PutCommand({
                TableName: "FriendRequests",
                Item: {
                    ...request,
                    status: "ACCEPTED",
                    updatedAt: new Date().toISOString(),
                },
            })
        );

        // Create bidirectional friendship
        await db.send(
            new PutCommand({
                TableName: "Friendships",
                Item: {
                    userId: request.fromUserId,
                    friendId: request.toUserId,
                    createdAt: new Date().toISOString(),
                },
            })
        );

        await db.send(
            new PutCommand({
                TableName: "Friendships",
                Item: {
                    userId: request.toUserId,
                    friendId: request.fromUserId,
                    createdAt: new Date().toISOString(),
                },
            })
        );

        res.json({ message: "Friend request accepted" });
    } catch (err) {
        console.error("ACCEPT FRIEND REQUEST ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// ❌ Reject friend request - PROTECTED ROUTE
app.put("/friend-requests/:requestId/reject", authMiddleware, async (req, res) => {
    try {
        const { requestId } = req.params;

        // Get the request
        const requestResult = await db.send(
            new GetCommand({
                TableName: "FriendRequests",
                Key: { requestId },
            })
        );

        if (!requestResult.Item) {
            return res.status(404).json({ error: "Friend request not found" });
        }

        const request = requestResult.Item;

        // Verify the current user is the recipient
        if (request.toUserId !== req.user.uid) {
            return res.status(403).json({ error: "Forbidden" });
        }

        // Update request status
        await db.send(
            new PutCommand({
                TableName: "FriendRequests",
                Item: {
                    ...request,
                    status: "REJECTED",
                    updatedAt: new Date().toISOString(),
                },
            })
        );

        res.json({ message: "Friend request rejected" });
    } catch (err) {
        console.error("REJECT FRIEND REQUEST ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// 🔍 Get friends list - PROTECTED ROUTE
app.get("/friends", authMiddleware, async (req, res) => {
    try {
        const command = new QueryCommand({
            TableName: "Friendships",
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": req.user.uid,
            },
        });

        const result = await db.send(command);
        const friendships = result.Items || [];

        // Fetch user details for each friend
        const friendsWithDetails = await Promise.all(
            friendships.map(async (friendship) => {
                try {
                    const userResult = await db.send(
                        new GetCommand({
                            TableName: "Users",
                            Key: { userId: friendship.friendId },
                        })
                    );

                    return userResult.Item || null;
                } catch (err) {
                    console.error(`Error fetching friend ${friendship.friendId}:`, err);
                    return null;
                }
            })
        );

        // Filter out null values
        const validFriends = friendsWithDetails.filter(friend => friend !== null);

        res.json(validFriends);
    } catch (err) {
        console.error("GET FRIENDS ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(5000, () => {
    console.log("Server running on port 5000 with Firebase Authentication");
});
