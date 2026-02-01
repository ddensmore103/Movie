require('dotenv').config();
const { DynamoDBClient, ListTablesCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });

async function listTables() {
    try {
        const command = new ListTablesCommand({});
        const result = await client.send(command);

        console.log('\n=== DynamoDB Tables ===\n');

        if (result.TableNames && result.TableNames.length > 0) {
            result.TableNames.forEach((tableName, index) => {
                const icon = tableName.includes('Friend') ? '👥' :
                    tableName.includes('List') ? '📋' :
                        tableName.includes('User') ? '👤' :
                            tableName.includes('Movie') ? '🎬' : '📊';
                console.log(`${index + 1}. ${icon} ${tableName}`);
            });

            console.log(`\nTotal: ${result.TableNames.length} tables\n`);

            // Check for required tables
            const requiredTables = ['Users', 'Lists', 'ListMovies', 'FriendRequests', 'Friendships'];
            const missingTables = requiredTables.filter(table => !result.TableNames.includes(table));

            if (missingTables.length > 0) {
                console.log('⚠️  Missing tables:');
                missingTables.forEach(table => console.log(`   - ${table}`));
            } else {
                console.log('✅ All required tables exist!');
            }
        } else {
            console.log('No tables found.');
        }

    } catch (err) {
        console.error('Error listing tables:', err.message);
    }
}

listTables();
