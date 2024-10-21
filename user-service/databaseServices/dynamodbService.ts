// dynamodbService.ts
import { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand, 
  QueryCommand, DeleteItemCommand, ConditionalCheckFailedException, 
  QueryCommandInput, UpdateItemCommand, ReturnValue, UpdateItemCommandOutput
} from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { User, UserUpdate } from '../interface/Iuser'
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const dynamodb = new DynamoDBClient({ region: process.env.REGION });

// #region Get user by ID

export const getUserById = async (user_id: string) => {
  const usersParams = {
    TableName: process.env.USERS_TABLE || '',
    Key: { user_id: { S: user_id } }
  };

  const userResponse = await dynamodb.send(new GetItemCommand(usersParams))

  const userItem = userResponse.Item ? unmarshall(userResponse.Item) : null;

  if(!userItem) return "No user with this ID.";

  let connectionParams: QueryCommandInput;

  if(userItem.type === 'Student'){
    connectionParams = {
      TableName: process.env.USERSCONNECT_TABLE,
      KeyConditionExpression: 'student_id = :id',
      ExpressionAttributeValues: {
        ':id': { S: user_id }
      }
    };
  }else{
    connectionParams = {
      TableName: process.env.USERSCONNECT_TABLE,
      IndexName: 'TrainerIdIndex',
      KeyConditionExpression: 'trainer_id = :id',
      ExpressionAttributeValues: {
        ':id': { S: user_id }
      }
    };
  }

  const connectionResponse = await dynamodb.send(new QueryCommand(connectionParams));
 
  const connectionItems = connectionResponse.Items || [];
  
  var trainers: any = [];
  var students: any = [];

  if (userItem.type === 'Student') {
    let trainerIds = connectionItems.map(({ trainer_id }) => trainer_id.S);
    let trainerPromises = trainerIds.map(id => id ? getUserDetails(id) : null);
  
    // Resolve all promises and filter out null results
    let trainerDetails = await Promise.all(trainerPromises);
    trainers.push(...trainerDetails.filter(details => details !== null));
  } else {
    let studentIds = connectionItems.map(({ student_id }) => student_id.S);
    let studentPromises = studentIds.map(id => id ? getUserDetails(id) : null);
  
    // Resolve all promises and filter out null results
    let studentDetails = await Promise.all(studentPromises);
    students.push(...studentDetails.filter(details => details !== null));
  }  

  if (userItem) {
    return {
      user_id: userItem.user_id,
      firstName: userItem.firstName,
      lastName: userItem.lastName,
      username: userItem.username,
      email: userItem.email,
      specialization: userItem.specialization,
      dateOfBirth: userItem.dateOfBirth,
      address: userItem.address,
      status: userItem.status,
      image: userItem.image,
      type: userItem.type,
      connections: userItem.type === 'Student' ? trainers : students
    };
  } else {
    return null;
  }
};

async function getUserDetails(id: string){
  const usersParams = {
    TableName: process.env.USERS_TABLE || '',
    Key: { user_id: { S: id } }
  };

  const userResponse = await dynamodb.send(new GetItemCommand(usersParams))

  const userItem = userResponse.Item ? unmarshall(userResponse.Item) : null;

  if (userItem) {
    return {
      name: `${userItem.firstName} ${userItem.lastName}`,
      status: userItem.status,
      specialization: userItem.specialization
    };
  } else {
    return null;
  }
}

// #endregion

// #region Get user by type

export const getUsersByType = async (type: string) => {
  const usersParams = {
    TableName: process.env.USERS_TABLE || '',
    FilterExpression: "#type = :type",
    ExpressionAttributeNames: {
      "#type": "type"
    },
    ExpressionAttributeValues: {
      ":type": { S: type }
    }
  };

  const usersResponse = await dynamodb.send(new ScanCommand(usersParams));
  const userItems = usersResponse.Items || [];

  const transformed = userItems.map(item => {
    const unmarshalledItem = unmarshall(item);
    return {
      user_id: unmarshalledItem.user_id,
      firstName: unmarshalledItem.firstName,
      lastName: unmarshalledItem.lastName,
      specialization: unmarshalledItem.specialization, // Optional for Trainer
      status: unmarshalledItem.status,
      type: unmarshalledItem.type
    };
  });

  if (transformed) {
    return transformed;
  } else {
    return null;
  }
};

// #endregion

// #region Create user

export const createUser = async (user: User) => {
  const existanceParams = {
    TableName: process.env.USERS_TABLE || '',
    FilterExpression: "#email = :email",
    ExpressionAttributeNames: {
      "#email": "email"
    },
    ExpressionAttributeValues: {
      ":email": { S: user.email }
    }
  };

  const usersResponse = await dynamodb.send(new ScanCommand(existanceParams));
  if(usersResponse.Items?.length > 0) return "Email already exists";

  const password = generateRandomPassword();
  const hashedPassword = await bcrypt.hash(password, 10);

  const extension = user.type === "Student" ? '_st' : '_tr';

  let id = uuidv4();

  const item = marshall({
    user_id: id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.firstName + extension,
    password: hashedPassword,
    email: user.email,
    image: "https://learning-platfrom-data.s3.eu-north-1.amazonaws.com/images/bg.jpg",
    specialization: user.specialization,
    dateOfBirth: user.dateOfBirth,
    address: user.address,
    status: user.status,
    type: user.type
  });

  const params = {
    TableName: process.env.USERS_TABLE || '',
    Item: item,
  };

  try {
    await dynamodb.send(new PutItemCommand(params));
    return { user_id: id, username: user.firstName + extension, password: password };
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Error creating user");
  }
};

const generateRandomPassword = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return password;
};

// #endregion

// #region Delete user by ID

export const deleteUserById = async (user_id: string) => {
  const params = {
    TableName: process.env.USERS_TABLE || '',
    Key: { user_id: { S: user_id } },
    // Check if the user exists before deleting
    ConditionExpression: "attribute_exists(user_id)"
  };

  try {
    await dynamodb.send(new DeleteItemCommand(params));
    return "User has been deleted.";
  } catch (error) {
    // Check if the error is due to the conditional check failure
    if (error instanceof ConditionalCheckFailedException) {
      console.error("User does not exist:", error);
      return "User does not exist";
    } else {
      console.error("Error deleting user:", error);
      return "Error deleting user";
    }
  }
};

// #endregion

// #region Connect users for "My Trainers" | "My Students"

export const connectUsersById = async (student_id: string, trainer_id: string) => {
  const params = {
    TableName: process.env.USERSCONNECT_TABLE || '',
    Item: {
      student_id: { S: student_id },
      trainer_id: { S: trainer_id }
    },
    // Check if the connection already exists before inserting
    ConditionExpression: "attribute_not_exists(student_id) AND attribute_not_exists(trainer_id)"
  };

  try {
    await dynamodb.send(new PutItemCommand(params));
    return "Successfully made the connection.";
  } catch (error) {
    // Check if the error is due to the conditional check failure
    if (error instanceof ConditionalCheckFailedException) {
      console.error("Connection already exists:", error);
      return "Connection already exists";
    } else {
      console.error("Error connecting users:", error);
      return "Error connecting users";
    }
  }
};

// #endregion

// #region Change password
export const changePassword = async (user_id: string, currentPassword: string, newPassword: string, confirmNewPassword: string) => {
  if(newPassword != confirmNewPassword) return "New password doesn't match.";

  const usersParams = {
    TableName: process.env.USERS_TABLE || '',
    Key: { user_id: { S: user_id } }
  };

  const userResponse = await dynamodb.send(new GetItemCommand(usersParams))

  const userItem = userResponse.Item ? unmarshall(userResponse.Item) : null;
  const passwordMatch = await bcrypt.compare(currentPassword, userItem?.password);
  if (!passwordMatch) {
    return "Wrong current password.";
  }

  const params = {
    TableName: process.env.USERS_TABLE || '',
    Key: marshall({ user_id }),
    UpdateExpression: 'set #pwd = :newPwd',
    ExpressionAttributeNames: { '#pwd': 'password' },
    ExpressionAttributeValues: marshall({ ':newPwd': bcrypt.hashSync(newPassword, 10) }),
    ReturnValues: ReturnValue.UPDATED_NEW,
  };

  try {
      await dynamodb.send(new UpdateItemCommand(params));
      return 'Password updated successfully.';
  } catch (error) {
      console.error('Error updating password:', error);
      return 'Failed to update password ' + error.message;
  }
}
// #endregion

// #region Update user

interface UserUpdate {
  [key: string]: string | number | boolean;
}

export const updateUser = async (user_id: string, attributesToUpdate: UserUpdate) => {
  try {
    const UpdateExpression = 'SET ' + Object.keys(attributesToUpdate).map((key, index) => `#attr${index} = :val${index}`).join(', ');
    
    const ExpressionAttributeNames = Object.keys(attributesToUpdate).reduce((acc, key, index) => ({ ...acc, [`#attr${index}`]: key }), {});

    const ExpressionAttributeValues = Object.keys(attributesToUpdate).reduce((acc, key, index) => {
      const value = attributesToUpdate[key];
      let attributeValue;

      if (typeof value === 'string') {
        attributeValue = { S: value };
      } else if (typeof value === 'number') {
        attributeValue = { N: value.toString() };
      } else if (typeof value === 'boolean') {
        attributeValue = { BOOL: value };
      } else {
        throw new Error(`Unsupported attribute value type for key: ${key}`);
      }

      return { ...acc, [`:val${index}`]: attributeValue };
    }, {});

    const params = {
      TableName: process.env.USERS_TABLE || '',
      Key: {
        user_id: { S: user_id }
      },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: ReturnValue.ALL_NEW
    };

    const result: UpdateItemCommandOutput = await dynamodb.send(new UpdateItemCommand(params));

    const resultAttributes = result.Attributes ? unmarshall(result.Attributes) : null;

    const filteredAttributes = resultAttributes ? {
      username: resultAttributes.username,
      firstName: resultAttributes.firstName,
      lastName: resultAttributes.lastName,
      email: resultAttributes.email,
      image: resultAttributes.image,
      specialization: resultAttributes.specialization,
      address: resultAttributes.address,
      dateOfBirth: resultAttributes.dateOfBirth,
      status: resultAttributes.status
    } : null;

    return filteredAttributes;
  } catch (error) {
    console.error('Error updating user:', error);
    return 'Failed to update user ' + error.message;
  }
}
// #endregion