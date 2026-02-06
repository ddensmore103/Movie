const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
require("dotenv").config();

const db = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const fs = require('fs');

async function listUsers() {
    try {
        console.log("Scanning Users table...");
        const command = new ScanCommand({
            TableName: "Users",
        });

        const result = await db.send(command);
        const users = result.Items || [];

        let output = `Found ${users.length} users:\n`;
        users.forEach(user => {
            output += `User: ${user.username} (${user.email})\n`;
            output += `  ID: ${user.userId}\n`;
            output += `  CreatedAt: ${user.createdAt}\n`;
            output += "-".repeat(20) + "\n";
        });

        fs.writeFileSync("debug_output.txt", output);
        console.log("Output written to debug_output.txt");

    } catch (err) {
        console.error("Error scanning users:", err);
    }
}

listUsers();
