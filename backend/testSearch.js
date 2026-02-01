require('dotenv').config();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(client);

async function testSearch(searchQuery) {
    try {
        console.log(`\nSearching for: "${searchQuery}"\n`);

        const command = new ScanCommand({
            TableName: "Users",
        });

        const result = await db.send(command);
        const users = result.Items || [];

        console.log(`Total users in table: ${users.length}\n`);

        const query = searchQuery.toLowerCase().trim();

        // Filter users by username or email (case-insensitive)
        const filteredUsers = users.filter(user => {
            const username = (user.username || "").toLowerCase();
            const email = (user.email || "").toLowerCase();

            const usernameMatch = username.includes(query);
            const emailMatch = email.includes(query);

            console.log(`Checking user: ${user.username} (${user.email})`);
            console.log(`  - username match: ${usernameMatch}`);
            console.log(`  - email match: ${emailMatch}`);

            return usernameMatch || emailMatch;
        });

        console.log(`\nMatching users: ${filteredUsers.length}\n`);

        filteredUsers.forEach(user => {
            console.log(`✓ ${user.username} - ${user.email}`);
        });

    } catch (err) {
        console.error('Error:', err.message);
    }
}

// Test with a search query
const searchTerm = process.argv[2] || 'test';
testSearch(searchTerm);
