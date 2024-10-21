
const { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config();
const trainings = require('../data/trainings.json');

// Create DynamoDB DocumentClient
const dynamodb = new DynamoDBClient({ region: process.env.REGION });

async function insertTraining(training) {
  const params = {
    TableName: process.env.TRAININGS_TABLE,
    Item: {
      date: { S: training.date },
      trainingName: { S: training.trainingName },
      training_id: { S: training.training_id },
      type: { S: training.type },
      studentName: { S: training.studentName },
      trainerName: { S: training.trainerName },
      duration: { S: training.duration },
      student_id: { S: training.student_id },
    }
  };

  try {
    await dynamodb.send(new PutItemCommand(params));
    console.log(`Training inserted successfully`);
  } catch (error) {
    console.error('Unable to insert training. Error JSON:', JSON.stringify(error, null, 2));
  }
}

// Insert sample data
async function fillTables() {
  for (const training of trainings) {
    await insertTraining(training);
  }
}

// Execute
fillTables();
