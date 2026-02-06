const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
require("dotenv").config();

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});
const db = DynamoDBDocumentClient.from(client);

const updateFavorites = async () => {
    try {
        console.log("Scanning for Favorites lists...");
        const scan = new ScanCommand({
            TableName: "Lists",
            FilterExpression: "#name = :name",
            ExpressionAttributeNames: { "#name": "name" },
            ExpressionAttributeValues: { ":name": "Favorites" }
        });

        const result = await db.send(scan);
        console.log(`Found ${result.Items.length} Favorites lists.`);

        for (const list of result.Items) {
            if (!list.isStarred) {
                console.log(`Updating list ${list.listId} (Owner: ${list.ownerId}) to be starred...`);
                await db.send(new UpdateCommand({
                    TableName: "Lists",
                    Key: { listId: list.listId },
                    UpdateExpression: "set isStarred = :true",
                    ExpressionAttributeValues: { ":true": true }
                }));
                console.log(`Updated.`);
            } else {
                console.log(`List ${list.listId} is already starred.`);
            }
        }
        console.log("Done.");
    } catch (e) {
        console.error("Error:", e);
    }
};

updateFavorites();
