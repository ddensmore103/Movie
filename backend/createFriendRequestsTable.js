const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { CreateTableCommand } = require("@aws-sdk/lib-dynamodb");
require("dotenv").config();

const db = new DynamoDBClient({
    region: process.env.AWS_REGION,
});

async function createFriendRequestsTable() {
    const params = {
        TableName: "FriendRequests",
        KeySchema: [
            { AttributeName: "requestId", KeyType: "HASH" }, // Partition key
        ],
        AttributeDefinitions: [
            { AttributeName: "requestId", AttributeType: "S" },
            { AttributeName: "toUserId", AttributeType: "S" },
            { AttributeName: "status", AttributeType: "S" },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: "toUserId-status-index",
                KeySchema: [
                    { AttributeName: "toUserId", KeyType: "HASH" },
                    { AttributeName: "status", KeyType: "RANGE" },
                ],
                Projection: {
                    ProjectionType: "ALL",
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5,
                },
            },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
    };

    try {
        const command = new CreateTableCommand(params);
        const result = await db.send(command);
        console.log("✅ FriendRequests table created successfully!");
        console.log(result);
    } catch (err) {
        if (err.name === "ResourceInUseException") {
            console.log("⚠️  FriendRequests table already exists");
        } else {
            console.error("❌ Error creating table:", err);
        }
    }
}

createFriendRequestsTable();
