'use strict';

import { handleResponse } from '../utils/handleResponse';
import { getUsersByType } from '../databaseServices/dynamodbService';

export const handler = async (event: any) => {
  try {
    const { type } = event.pathParameters || {};
    
    const user = await getUsersByType(type);

    if (!user) return handleResponse(404, 'No users found.');

    return handleResponse(200, JSON.stringify(user));
  } catch (error) {
    console.error('Error:', error);
    return handleResponse(500, error.message || 'Internal server error');
  }
};