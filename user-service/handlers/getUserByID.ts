'use strict';

import { handleResponse } from '../utils/handleResponse';
import { getUserById } from '../databaseServices/dynamodbService';

export const handler = async (event: any) => {
  try {
    const { user_id } = event.pathParameters || {};
    
    const user = await getUserById(user_id);

    if (!user) return handleResponse(404, 'User not found.');

    return handleResponse(200, JSON.stringify(user));
  } catch (error) {
    console.error('Error:', error);
    return handleResponse(500, error.message || 'Internal server error');
  }
};