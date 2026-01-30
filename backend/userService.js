/**
 * User Service
 * Handles user-related operations with DynamoDB
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

const db = new DynamoDBClient({
    region: process.env.AWS_REGION,
});

/**
 * Get or create a user in DynamoDB
 * If user doesn't exist, creates a new user record
 * @param {string} uid - Firebase user ID
 * @param {string} email - User's email
 * @returns {Promise<Object>} User object
 */
const getOrCreateUser = async (uid, email) => {
    try {
        // Try to get existing user
        const getResult = await db.send(
            new GetCommand({
                TableName: "Users",
                Key: { userId: uid },
            })
        );

        // If user exists, return it
        if (getResult.Item) {
            return getResult.Item;
        }

        // User doesn't exist, create new user
        const newUser = {
            userId: uid,
            email: email,
            createdAt: new Date().toISOString(),
        };

        await db.send(
            new PutCommand({
                TableName: "Users",
                Item: newUser,
            })
        );

        console.log(`Created new user: ${uid} (${email})`);
        return newUser;
    } catch (error) {
        console.error("Error in getOrCreateUser:", error);
        throw error;
    }
};

module.exports = {
    getOrCreateUser,
};
