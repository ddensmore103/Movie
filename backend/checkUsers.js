require('dotenv').config();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(client);

async function checkUsers() {
    try {
        console.log('Scanning Users table...\n');

        const command = new ScanCommand({
            TableName: "Users",
        });

        const result = await db.send(command);

        console.log(`Found ${result.Items?.length || 0} users:\n`);

        if (result.Items && result.Items.length > 0) {
            result.Items.forEach((user, index) => {
                console.log(`User ${index + 1}:`);
                console.log(`  - userId: ${user.userId}`);
                console.log(`  - username: ${user.username}`);
                console.log(`  - email: ${user.email}`);
                console.log(`  - createdAt: ${user.createdAt}`);
                console.log('');
            });
        } else {
            console.log('No users found in the Users table!');
            console.log('This means users are not being created after Firebase signup.');
        }

    } catch (err) {
        console.error('Error scanning Users table:', err.message);
        if (err.name === 'ResourceNotFoundException') {
            console.log('\n❌ Users table does not exist!');
        }
    }
}

checkUsers();
