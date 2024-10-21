'use strict';

import { handleResponse } from '../utils/handleResponse';
import { connectUsersById } from '../databaseServices/dynamodbService';

export const handler = async (event: any) => {
  try {
    const { student_id, trainer_id } = JSON.parse(event.body) || {};

    const response = await connectUsersById(student_id, trainer_id);

    return handleResponse(200, response);
  } catch (error) {
    console.error('Error:', error);
    return handleResponse(500, error.message || 'Internal server error');
  }
};