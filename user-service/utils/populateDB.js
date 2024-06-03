
const { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const users = require('../data/users.json');

users.forEach(async element => {
    element.user_id = uuidv4();
    element.password = bcrypt.hashSync('123', 10);
});

// Create DynamoDB DocumentClient
const dynamodb = new DynamoDBClient({ region: process.env.REGION });

async function insertUsers(user) {
  const params = {
    TableName: process.env.USERS_TABLE,
    Item: {
      user_id: { S: user.user_id },
      firstName: { S: user.firstName },
      lastName: { S: user.lastName },
      username: { S: user.username },
      password: { S: user.password },
      email: { S: user.email },
      specialization: { S: user.specialization },
      dateOfBirth: { S: user.dateOfBirth },
      address: { S: user.address },
      status: { BOOL: user.status },
      image: { S: user.image },
      type: { S: user.type }
    }
  };

  try {
    await dynamodb.send(new PutItemCommand(params));
    console.log(`User ${user.user_id} inserted successfully`);
  } catch (error) {
    console.log(error);
    //console.error('Unable to insert user. Error JSON:', JSON.stringify(error, null, 2));
  }
}

// Insert sample data
async function fillTables() {
  for (const user of users) {
    await insertUsers(user);
  }
}

// Execute
fillTables();
