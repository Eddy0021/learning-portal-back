'use strict';

import { handleResponse } from '../utils/handleResponse';
import { getTrainingById } from '../databaseServices/dynamodbService';

export const handler = async (event: any) => {
  try {
    const { student_id } = event.pathParameters || {};
    
    const trainngs = await getTrainingById(student_id);

    if (!trainngs) return handleResponse(404, 'No training for this id.');

    return handleResponse(200, JSON.stringify(trainngs));
  } catch (error) {
    console.error('Error:', error);
    return handleResponse(500, error.message || 'Internal server error');
  }
};