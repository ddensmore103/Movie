const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    ScanCommand,
    QueryCommand,
    DeleteCommand,
    GetCommand
} = require("@aws-sdk/lib-dynamodb");
require("dotenv").config();

const db = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// ddensmore103 (from previous debug output)
const TARGET_USER_ID = "0MOmFiO0WURRYse9x9NOYBdf7a72";

async function cleanupUser() {
    try {
        console.log(`[CLEANUP] Starting manual cleanup for user: ${TARGET_USER_ID}`);

        // 0. Verify user exists
        const userCheck = await db.send(new GetCommand({
            TableName: "Users",
            Key: { userId: TARGET_USER_ID }
        }));

        if (!userCheck.Item) {
            console.log("User not found (already deleted?)");
            return;
        }
        console.log(`Found user: ${userCheck.Item.username} (${userCheck.Item.email})`);

        // 1. Delete lists owned by user
        const listQuery = new ScanCommand({
            TableName: "Lists",
            FilterExpression: "ownerId = :ownerId",
            ExpressionAttributeValues: { ":ownerId": TARGET_USER_ID },
        });

        const listResult = await db.send(listQuery);
        const userLists = listResult.Items || [];
        console.log(`[CLEANUP] Found ${userLists.length} lists to delete`);

        for (const list of userLists) {
            // Delete movies
            const moviesResult = await db.send(new QueryCommand({
                TableName: "ListMovies",
                KeyConditionExpression: "listId = :listId",
                ExpressionAttributeValues: { ":listId": list.listId }
            }));
            for (const movie of moviesResult.Items || []) {
                await db.send(new DeleteCommand({
                    TableName: "ListMovies",
                    Key: { listId: movie.listId, movieId: movie.movieId }
                }));
            }

            // Delete collaborators
            const collabsResult = await db.send(new QueryCommand({
                TableName: "ListCollaborators",
                KeyConditionExpression: "listId = :listId",
                ExpressionAttributeValues: { ":listId": list.listId }
            }));
            for (const collab of collabsResult.Items || []) {
                await db.send(new DeleteCommand({
                    TableName: "ListCollaborators",
                    Key: { listId: collab.listId, userId: collab.userId }
                }));
            }

            // Delete list
            await db.send(new DeleteCommand({
                TableName: "Lists",
                Key: { listId: list.listId }
            }));
            console.log(`  Deleted list: ${list.name}`);
        }

        // 2. Remove from collaborations
        const userCollabsResult = await db.send(new QueryCommand({
            TableName: "ListCollaborators",
            IndexName: "userId-index",
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: { ":userId": TARGET_USER_ID }
        }));
        console.log(`[CLEANUP] Found ${userCollabsResult.Items?.length || 0} collaborations to remove`);
        for (const collab of userCollabsResult.Items || []) {
            await db.send(new DeleteCommand({
                TableName: "ListCollaborators",
                Key: { listId: collab.listId, userId: TARGET_USER_ID }
            }));
        }

        // 3. Friendships (Best effort)
        try {
            const friendships1 = await db.send(new ScanCommand({
                TableName: "Friendships",
                FilterExpression: "userId1 = :uid OR userId2 = :uid",
                ExpressionAttributeValues: { ":uid": TARGET_USER_ID }
            }));
            console.log(`[CLEANUP] Found ${friendships1.Items?.length || 0} friendships to remove`);
            for (const f of friendships1.Items || []) {
                await db.send(new DeleteCommand({
                    TableName: "Friendships",
                    Key: { userId1: f.userId1, userId2: f.userId2 }
                }));
            }
        } catch (e) { console.warn("Friendships table error:", e.message); }

        // 4. Friend Requests
        try {
            const outgoing = await db.send(new ScanCommand({
                TableName: "FriendRequests",
                FilterExpression: "fromUserId = :uid",
                ExpressionAttributeValues: { ":uid": TARGET_USER_ID }
            }));
            const incoming = await db.send(new ScanCommand({
                TableName: "FriendRequests",
                FilterExpression: "toUserId = :uid",
                ExpressionAttributeValues: { ":uid": TARGET_USER_ID }
            }));
            const allRequests = [...(outgoing.Items || []), ...(incoming.Items || [])];
            console.log(`[CLEANUP] Found ${allRequests.length} friend requests to delete`);
            for (const r of allRequests) {
                await db.send(new DeleteCommand({
                    TableName: "FriendRequests",
                    Key: { id: r.id }
                }));
            }
        } catch (e) { console.warn("FriendRequests table error:", e.message); }

        // 5. User Reviews
        try {
            const reviewsResult = await db.send(new QueryCommand({
                TableName: "Reviews",
                IndexName: "userId-index",
                KeyConditionExpression: "userId = :userId",
                ExpressionAttributeValues: { ":userId": TARGET_USER_ID }
            }));
            console.log(`[CLEANUP] Found ${reviewsResult.Items?.length || 0} reviews to delete`);
            for (const review of reviewsResult.Items || []) {
                await db.send(new DeleteCommand({
                    TableName: "Reviews",
                    Key: { reviewId: review.reviewId }
                }));
            }
        } catch (e) {
            console.error("Reviews table error:", e.message);
        }

        // 6. Delete User
        await db.send(new DeleteCommand({
            TableName: "Users",
            Key: { userId: TARGET_USER_ID }
        }));

        console.log("✅ User cleanup complete!");

    } catch (err) {
        console.error("Cleanup failed:", err);
    }
}

cleanupUser();
