'use strict';

import { loginUser } from '../databaseServices/dynamodbService';
import { handleResponse } from '../utils/handleResponse';

export const handler = async (event: any) => {
  try {
    // Parse the request body to extract product data
    const { username, password } = JSON.parse(event.body || '');

    const response = await loginUser(username, password);

    return handleResponse(200, JSON.stringify(response));
  } catch (error) {
    console.error('Error:', error);
    return handleResponse(500, error);
  }
};
