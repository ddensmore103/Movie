const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { CreateTableCommand } = require("@aws-sdk/lib-dynamodb");
require("dotenv").config();

const db = new DynamoDBClient({
    region: process.env.AWS_REGION,
});

async function createFriendshipsTable() {
    const params = {
        TableName: "Friendships",
        KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" },    // Partition key
            { AttributeName: "friendId", KeyType: "RANGE" }, // Sort key
        ],
        AttributeDefinitions: [
            { AttributeName: "userId", AttributeType: "S" },
            { AttributeName: "friendId", AttributeType: "S" },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
    };

    try {
        const command = new CreateTableCommand(params);
        const result = await db.send(command);
        console.log("✅ Friendships table created successfully!");
        console.log(result);
    } catch (err) {
        if (err.name === "ResourceInUseException") {
            console.log("⚠️  Friendships table already exists");
        } else {
            console.error("❌ Error creating table:", err);
        }
    }
}

createFriendshipsTable();
