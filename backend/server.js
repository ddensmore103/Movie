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
    origin: [
        'http://localhost:5173',                        // Local development
        'http://localhost:3000',                        // Alternative local port
        'https://movieapp-ten-lovat.vercel.app'         // ✅ Your Vercel URL (no trailing slash!)
    ],
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

// Middleware to check if user can edit a list (owner or collaborator)
const canEditList = async (req, res, next) => {
    try {
        const { listId } = req.params;
        const userId = req.user.uid;

        // Get the list
        const listResult = await db.send(
            new GetCommand({
                TableName: "Lists",
                Key: { listId },
            })
        );

        if (!listResult.Item) {
            return res.status(404).json({ error: "List not found" });
        }

        const list = listResult.Item;

        // Check if user is owner
        if (list.ownerId === userId) {
            req.list = list;
            req.isOwner = true;
            return next();
        }

        // Check if user is a collaborator
        const collaboratorResult = await db.send(
            new GetCommand({
                TableName: "ListCollaborators",
                Key: { listId, userId },
            })
        );

        if (collaboratorResult.Item) {
            req.list = list;
            req.isOwner = false;
            return next();
        }

        // User is neither owner nor collaborator
        return res.status(403).json({ error: "You don't have permission to edit this list" });
    } catch (err) {
        console.error("canEditList middleware error:", err);
        res.status(500).json({ error: err.message });
    }
};

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

// 🔍 Get lists user is collaborating on - PROTECTED ROUTE
// IMPORTANT: This must be defined BEFORE /lists/:listId to avoid route conflicts
app.get("/lists/collaborating", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;

        // Query using GSI to find all lists user is collaborating on
        const result = await db.send(
            new QueryCommand({
                TableName: "ListCollaborators",
                IndexName: "userId-index",
                KeyConditionExpression: "userId = :userId",
                ExpressionAttributeValues: {
                    ":userId": userId,
                },
            })
        );

        const collaborations = result.Items || [];

        // Fetch list details for each collaboration
        const listsWithMovies = await Promise.all(
            collaborations.map(async (collab) => {
                // Get list details
                const listResult = await db.send(
                    new GetCommand({
                        TableName: "Lists",
                        Key: { listId: collab.listId },
                    })
                );

                if (!listResult.Item) return null;

                const list = listResult.Item;

                // Get movies for this list
                const moviesResult = await db.send(
                    new QueryCommand({
                        TableName: "ListMovies",
                        KeyConditionExpression: "listId = :listId",
                        ExpressionAttributeValues: {
                            ":listId": collab.listId,
                        },
                    })
                );

                return {
                    ...list,
                    movies: moviesResult.Items || [],
                    isCollaborating: true,
                };
            })
        );

        // Filter out null values (deleted lists)
        const validLists = listsWithMovies.filter(list => list !== null);

        res.json(validLists);
    } catch (err) {
        console.error("GET COLLABORATING LISTS ERROR:", err);
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

// 🔍 Get list by ID with movies - PROTECTED ROUTE (owner or collaborator)
app.get("/lists/:listId", authMiddleware, canEditList, async (req, res) => {
    try {
        const { listId } = req.params;

        // List is already verified by canEditList middleware
        const list = req.list;

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

        // Get collaborators for this list
        const collaboratorsResult = await db.send(
            new QueryCommand({
                TableName: "ListCollaborators",
                KeyConditionExpression: "listId = :listId",
                ExpressionAttributeValues: {
                    ":listId": listId,
                },
            })
        );

        // Fetch user details for each collaborator
        const collaborators = await Promise.all(
            (collaboratorsResult.Items || []).map(async (collab) => {
                const userResult = await db.send(
                    new GetCommand({
                        TableName: "Users",
                        Key: { userId: collab.userId },
                    })
                );
                return {
                    ...collab,
                    user: userResult.Item || { userId: collab.userId, username: "Unknown" },
                };
            })
        );

        res.json({
            ...list,
            movies: moviesResult.Items || [],
            collaborators,
            isOwner: req.isOwner,
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

// ➕ Add movie to list - PROTECTED ROUTE (owner or collaborator)
app.post("/lists/:listId/movies", authMiddleware, canEditList, async (req, res) => {
    try {
        const { listId } = req.params;
        const { tmdbId, title, posterPath, releaseDate, rating } = req.body;

        if (!tmdbId || !title) {
            return res.status(400).json({ error: "tmdbId and title are required" });
        }

        // List is already verified by canEditList middleware
        const list = req.list;

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

// 🗑️ Remove movie from list - PROTECTED ROUTE (owner or collaborator)
app.delete("/lists/:listId/movies/:movieId", authMiddleware, canEditList, async (req, res) => {
    try {
        const { listId, movieId } = req.params;

        // List is already verified by canEditList middleware

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

// ➕ Add collaborator to list - PROTECTED ROUTE (owner only)
app.post("/lists/:listId/collaborators", authMiddleware, async (req, res) => {
    try {
        const { listId } = req.params;
        const { userId: collaboratorUserId } = req.body;
        const ownerId = req.user.uid;

        if (!collaboratorUserId) {
            return res.status(400).json({ error: "userId is required" });
        }

        // Get the list and verify ownership
        const listResult = await db.send(
            new GetCommand({
                TableName: "Lists",
                Key: { listId },
            })
        );

        if (!listResult.Item) {
            return res.status(404).json({ error: "List not found" });
        }

        if (listResult.Item.ownerId !== ownerId) {
            return res.status(403).json({ error: "Only the list owner can add collaborators" });
        }

        // Check if user is trying to add themselves
        if (collaboratorUserId === ownerId) {
            return res.status(400).json({ error: "You are already the owner of this list" });
        }

        // Check if already a collaborator
        const existingCollaborator = await db.send(
            new GetCommand({
                TableName: "ListCollaborators",
                Key: { listId, userId: collaboratorUserId },
            })
        );

        if (existingCollaborator.Item) {
            return res.status(400).json({ error: "User is already a collaborator" });
        }

        // Verify the user exists
        const userResult = await db.send(
            new GetCommand({
                TableName: "Users",
                Key: { userId: collaboratorUserId },
            })
        );

        if (!userResult.Item) {
            return res.status(404).json({ error: "User not found" });
        }

        // Add collaborator
        const collaborator = {
            listId,
            userId: collaboratorUserId,
            addedBy: ownerId,
            addedAt: new Date().toISOString(),
            role: "collaborator",
        };

        await db.send(
            new PutCommand({
                TableName: "ListCollaborators",
                Item: collaborator,
            })
        );

        res.status(201).json({
            ...collaborator,
            user: userResult.Item,
        });
    } catch (err) {
        console.error("ADD COLLABORATOR ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// 🗑️ Remove collaborator from list - PROTECTED ROUTE (owner only)
app.delete("/lists/:listId/collaborators/:userId", authMiddleware, async (req, res) => {
    try {
        const { listId, userId: collaboratorUserId } = req.params;
        const ownerId = req.user.uid;

        // Get the list and verify ownership
        const listResult = await db.send(
            new GetCommand({
                TableName: "Lists",
                Key: { listId },
            })
        );

        if (!listResult.Item) {
            return res.status(404).json({ error: "List not found" });
        }

        if (listResult.Item.ownerId !== ownerId) {
            return res.status(403).json({ error: "Only the list owner can remove collaborators" });
        }

        // Remove collaborator
        await db.send(
            new DeleteCommand({
                TableName: "ListCollaborators",
                Key: { listId, userId: collaboratorUserId },
            })
        );

        res.json({ message: "Collaborator removed successfully" });
    } catch (err) {
        console.error("REMOVE COLLABORATOR ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// 🔍 Get collaborators for a list - PROTECTED ROUTE
app.get("/lists/:listId/collaborators", authMiddleware, async (req, res) => {
    try {
        const { listId } = req.params;

        // Query collaborators
        const result = await db.send(
            new QueryCommand({
                TableName: "ListCollaborators",
                KeyConditionExpression: "listId = :listId",
                ExpressionAttributeValues: {
                    ":listId": listId,
                },
            })
        );

        const collaborators = result.Items || [];

        // Fetch user details for each collaborator
        const collaboratorsWithDetails = await Promise.all(
            collaborators.map(async (collab) => {
                const userResult = await db.send(
                    new GetCommand({
                        TableName: "Users",
                        Key: { userId: collab.userId },
                    })
                );
                return {
                    ...collab,
                    user: userResult.Item || { userId: collab.userId, username: "Unknown" },
                };
            })
        );

        res.json(collaboratorsWithDetails);
    } catch (err) {
        console.error("GET COLLABORATORS ERROR:", err);
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

/* =========================
   MOVIE REVIEWS
========================= */

// ➕ Create a new review - PROTECTED ROUTE
app.post("/reviews", authMiddleware, async (req, res) => {
    try {
        const { movieId, tmdbId, rating, reviewText, watchDate, movieTitle, posterPath } = req.body;
        const userId = req.user.uid;

        if (!movieId || !rating) {
            return res.status(400).json({ error: "movieId and rating are required" });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Rating must be between 1 and 5" });
        }

        // Check if user already has a review for this movie
        const existingReviewCommand = new QueryCommand({
            TableName: "Reviews",
            IndexName: "userId-index",
            KeyConditionExpression: "userId = :userId",
            FilterExpression: "movieId = :movieId",
            ExpressionAttributeValues: {
                ":userId": userId,
                ":movieId": movieId,
            },
        });

        const existingResult = await db.send(existingReviewCommand);
        if (existingResult.Items && existingResult.Items.length > 0) {
            return res.status(400).json({ error: "You already have a review for this movie. Use PUT to update it." });
        }

        const review = {
            reviewId: crypto.randomUUID(),
            userId,
            movieId,
            tmdbId: tmdbId || null,
            movieTitle: movieTitle || null,
            posterPath: posterPath || null,
            rating: parseFloat(rating),
            reviewText: reviewText || null,
            watchDate: watchDate || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await db.send(
            new PutCommand({
                TableName: "Reviews",
                Item: review,
            })
        );

        res.status(201).json(review);
    } catch (err) {
        console.error("CREATE REVIEW ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// 🔄 Update a review - PROTECTED ROUTE (owner only)
app.put("/reviews/:reviewId", authMiddleware, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, reviewText, watchDate } = req.body;
        const userId = req.user.uid;

        // Get the existing review
        const reviewResult = await db.send(
            new GetCommand({
                TableName: "Reviews",
                Key: { reviewId },
            })
        );

        if (!reviewResult.Item) {
            return res.status(404).json({ error: "Review not found" });
        }

        // Verify ownership
        if (reviewResult.Item.userId !== userId) {
            return res.status(403).json({ error: "You can only edit your own reviews" });
        }

        // Validate rating if provided
        if (rating !== undefined && (rating < 1 || rating > 5)) {
            return res.status(400).json({ error: "Rating must be between 1 and 5" });
        }

        // Update the review
        const updatedReview = {
            ...reviewResult.Item,
            rating: rating !== undefined ? parseFloat(rating) : reviewResult.Item.rating,
            reviewText: reviewText !== undefined ? reviewText : reviewResult.Item.reviewText,
            watchDate: watchDate !== undefined ? watchDate : reviewResult.Item.watchDate,
            updatedAt: new Date().toISOString(),
        };

        await db.send(
            new PutCommand({
                TableName: "Reviews",
                Item: updatedReview,
            })
        );

        res.json(updatedReview);
    } catch (err) {
        console.error("UPDATE REVIEW ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// 🗑️ Delete a review - PROTECTED ROUTE (owner only)
app.delete("/reviews/:reviewId", authMiddleware, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.uid;

        // Get the review to verify ownership
        const reviewResult = await db.send(
            new GetCommand({
                TableName: "Reviews",
                Key: { reviewId },
            })
        );

        if (!reviewResult.Item) {
            return res.status(404).json({ error: "Review not found" });
        }

        // Verify ownership
        if (reviewResult.Item.userId !== userId) {
            return res.status(403).json({ error: "You can only delete your own reviews" });
        }

        // Delete the review
        await db.send(
            new DeleteCommand({
                TableName: "Reviews",
                Key: { reviewId },
            })
        );

        res.json({ message: "Review deleted successfully" });
    } catch (err) {
        console.error("DELETE REVIEW ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// 🔍 Get all reviews for a specific movie
app.get("/reviews/movie/:movieId", async (req, res) => {
    try {
        const { movieId } = req.params;

        const command = new QueryCommand({
            TableName: "Reviews",
            IndexName: "movieId-index",
            KeyConditionExpression: "movieId = :movieId",
            ExpressionAttributeValues: {
                ":movieId": movieId,
            },
            ScanIndexForward: false, // Most recent first
        });

        const result = await db.send(command);
        const reviews = result.Items || [];

        // Fetch user details for each review
        const reviewsWithUsers = await Promise.all(
            reviews.map(async (review) => {
                try {
                    const userResult = await db.send(
                        new GetCommand({
                            TableName: "Users",
                            Key: { userId: review.userId },
                        })
                    );
                    return {
                        ...review,
                        user: userResult.Item || { userId: review.userId, username: "Unknown" },
                    };
                } catch (err) {
                    console.error(`Error fetching user ${review.userId}:`, err);
                    return {
                        ...review,
                        user: { userId: review.userId, username: "Unknown" },
                    };
                }
            })
        );

        res.json(reviewsWithUsers);
    } catch (err) {
        console.error("GET MOVIE REVIEWS ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// 🔍 Get all reviews by a specific user
app.get("/reviews/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const command = new QueryCommand({
            TableName: "Reviews",
            IndexName: "userId-index",
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId,
            },
            ScanIndexForward: false, // Most recent first
        });

        const result = await db.send(command);
        res.json(result.Items || []);
    } catch (err) {
        console.error("GET USER REVIEWS ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// 🔍 Get current user's reviews - PROTECTED ROUTE
app.get("/reviews/my-reviews", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;

        const command = new QueryCommand({
            TableName: "Reviews",
            IndexName: "userId-index",
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId,
            },
            ScanIndexForward: false, // Most recent first
        });

        const result = await db.send(command);
        res.json(result.Items || []);
    } catch (err) {
        console.error("GET MY REVIEWS ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} with Firebase Authentication`);
    });
}

// Export for Vercel serverless
module.exports = app;
