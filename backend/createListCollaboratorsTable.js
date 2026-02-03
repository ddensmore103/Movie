const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");
require("dotenv").config();

const db = new DynamoDBClient({
    region: process.env.AWS_REGION,
});

async function createListCollaboratorsTable() {
    const params = {
        TableName: "ListCollaborators",
        KeySchema: [
            { AttributeName: "listId", KeyType: "HASH" }, // Partition key
            { AttributeName: "userId", KeyType: "RANGE" }, // Sort key
        ],
        AttributeDefinitions: [
            { AttributeName: "listId", AttributeType: "S" },
            { AttributeName: "userId", AttributeType: "S" },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: "userId-index",
                KeySchema: [
                    { AttributeName: "userId", KeyType: "HASH" },
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
        console.log("✅ ListCollaborators table created successfully!");
        console.log("Table ARN:", result.TableDescription.TableArn);
        console.log("\nTable Details:");
        console.log("- Partition Key: listId (String)");
        console.log("- Sort Key: userId (String)");
        console.log("- GSI: userId-index (for querying lists by collaborator)");
        console.log("\nWait a few moments for the table to become ACTIVE before using it.");
    } catch (err) {
        if (err.name === "ResourceInUseException") {
            console.log("⚠️  ListCollaborators table already exists");
        } else {
            console.error("❌ Error creating table:", err);
        }
    }
}

createListCollaboratorsTable();
