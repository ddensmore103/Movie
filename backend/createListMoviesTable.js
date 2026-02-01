const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { CreateTableCommand } = require("@aws-sdk/client-dynamodb");
require("dotenv").config();

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
});

async function createListMoviesTable() {
    const params = {
        TableName: "ListMovies",
        KeySchema: [
            { AttributeName: "listId", KeyType: "HASH" },  // Partition key
            { AttributeName: "movieId", KeyType: "RANGE" }  // Sort key
        ],
        AttributeDefinitions: [
            { AttributeName: "listId", AttributeType: "S" },
            { AttributeName: "movieId", AttributeType: "S" }
        ],
        BillingMode: "PAY_PER_REQUEST", // On-demand billing
    };

    try {
        const command = new CreateTableCommand(params);
        const response = await client.send(command);
        console.log("✅ ListMovies table created successfully!");
        console.log("Table details:", JSON.stringify(response.TableDescription, null, 2));
    } catch (error) {
        if (error.name === "ResourceInUseException") {
            console.log("ℹ️  ListMovies table already exists.");
        } else {
            console.error("❌ Error creating table:", error);
            throw error;
        }
    }
}

createListMoviesTable();
