// dynamodbService.ts
import { DynamoDBClient, ScanCommand, AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { generateToken, verifyToken } from '../utils/token';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const dynamodb = new DynamoDBClient({ region: process.env.REGION });

// #region login user
export const loginUser = async (username: string, password: string) => {
  try {
    const usersParams = {
      TableName: process.env.USERS_TABLE || '',
      FilterExpression: "#username = :username",
      ExpressionAttributeNames: {
        "#username": "username"
      },
      ExpressionAttributeValues: {
        ":username": { S: username }
      }
    };
  
    const usersResponse = await dynamodb.send(new ScanCommand(usersParams));
    const userItem = usersResponse.Items;

    if(!userItem || userItem?.length === 0) return "Wrong username.";

    const user = unmarshall(userItem[0]);

    console.log(user); 

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) return "Wrong password.";

    const token = generateToken(user.user_id);

    return { user_id: user.user_id, token: token };
  } catch (error) {
    console.error(error)
    return "Error" + error;
  }
}
// #endregion

// #region verify user
export const verifyUser = async (authorization: string) => {
  try {
    const authHeader = authorization;
    const token = authHeader.split(' ')[1];

    const isValid = verifyToken(token);
    
    const response = {
      isAuthorized: isValid.verified
    }

    console.log('Response', JSON.stringify(response));

    return response;
  } catch (error) {
    console.error('Error:', error);
    return new Error("Errr: " + error)
  }
}
// #endregion