// dynamodbService.ts
import { DynamoDBClient, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { Training } from '../interface/Itraining';
import { v4 as uuidv4 } from 'uuid';

const dynamodb = new DynamoDBClient({ region: process.env.REGION });

// #region Get trainings

export const getTrainings = async () => {
  const params = {
    TableName: process.env.TRAININGS_TABLE || ''
  };

  const response = await dynamodb.send(new ScanCommand(params));
  const trainings = response.Items || [];

  const transformedTrainings = trainings.map(item => unmarshall(item));

  return transformedTrainings.length > 0 ? transformedTrainings : null;
};

// #endregion

// #region Get training by student_id

export const getTrainingById = async (student_id: string) => {
  const params = {
    TableName: process.env.TRAININGS_TABLE || '',
    FilterExpression: "#student_id = :student_id",
    ExpressionAttributeNames: {
      "#student_id": "student_id"
    },
    ExpressionAttributeValues: {
      ":student_id": { S: student_id }
    }
  };

  const response = await dynamodb.send(new ScanCommand(params));
  const trainings = response.Items || [];

  const transformedTrainings = trainings.map(item => unmarshall(item));

  if (transformedTrainings) {
    return transformedTrainings;
  } else {
    return null;
  }
};

// #endregion

// #region Create training

export const createTraining = async (training: Training) => {
  const item = marshall({
    date: training.date,
    trainingName: training.trainingName,
    training_id: uuidv4(),
    type: training.type,
    studentName: training.studentName,
    trainerName: training.trainerName,
    duration: training.duration,
    student_id: training.student_id,
  });

  const params = {
    TableName: process.env.TRAININGS_TABLE || '',
    Item: item,
  };

  try {
    await dynamodb.send(new PutItemCommand(params));
    return "Succssefully created training.";
  } catch (error) {
    console.error("Error creating training:", error);
    return "Error creating training";
  }
};
// #endregion
