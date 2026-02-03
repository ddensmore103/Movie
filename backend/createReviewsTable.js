const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { CreateTableCommand } = require("@aws-sdk/client-dynamodb");
require("dotenv").config();

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
});

const createReviewsTable = async () => {
    const params = {
        TableName: "Reviews",
        KeySchema: [
            { AttributeName: "reviewId", KeyType: "HASH" }, // Partition key
        ],
        AttributeDefinitions: [
            { AttributeName: "reviewId", AttributeType: "S" },
            { AttributeName: "movieId", AttributeType: "S" },
            { AttributeName: "userId", AttributeType: "S" },
            { AttributeName: "createdAt", AttributeType: "S" },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: "movieId-index",
                KeySchema: [
                    { AttributeName: "movieId", KeyType: "HASH" },
                    { AttributeName: "createdAt", KeyType: "RANGE" },
                ],
                Projection: {
                    ProjectionType: "ALL",
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5,
                },
            },
            {
                IndexName: "userId-index",
                KeySchema: [
                    { AttributeName: "userId", KeyType: "HASH" },
                    { AttributeName: "createdAt", KeyType: "RANGE" },
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
        const data = await client.send(new CreateTableCommand(params));
        console.log("✅ Reviews table created successfully:", data);
        console.log("Table ARN:", data.TableDescription.TableArn);
    } catch (err) {
        if (err.name === "ResourceInUseException") {
            console.log("⚠️  Reviews table already exists");
        } else {
            console.error("❌ Error creating Reviews table:", err);
        }
    }
};

createReviewsTable();
