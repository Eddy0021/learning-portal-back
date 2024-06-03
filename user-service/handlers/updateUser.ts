'use strict';

import { updateUser } from '../databaseServices/dynamodbService';
import { handleResponse } from '../utils/handleResponse';

export const handler = async (event: any) => {
  try {
    // Parse the request body to extract product data
    const { user_id, ...attributesToUpdate } = JSON.parse(event.body || '');

    const response = await updateUser(user_id, attributesToUpdate);

    return handleResponse(200, JSON.stringify(response));
  } catch (error) {
    console.error('Error:', error);
    return handleResponse(500, error);
  }
};
