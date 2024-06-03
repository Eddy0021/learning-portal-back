'use strict';

import { handleResponse } from '../utils/handleResponse';
import { deleteUserById } from '../databaseServices/dynamodbService';

export const handler = async (event: any) => {
  try {
    const { user_id } = event.pathParameters || {};

    // Get product details from DynamoDB
    const response = await deleteUserById(user_id);

    return handleResponse(200, response);
  } catch (error) {
    console.error('Error:', error);
    return handleResponse(500, error.message || 'Internal server error');
  }
};