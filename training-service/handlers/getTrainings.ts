'use strict';

import { handleResponse } from '../utils/handleResponse';
import { getTrainings } from '../databaseServices/dynamodbService';

export const handler = async (event: any) => {
  try {  
    const trainings = await getTrainings();

    if (!trainings) return handleResponse(404, 'No trainings found.');

    return handleResponse(200, JSON.stringify(trainings));
  } catch (error) {
    console.error('Error:', error);
    return handleResponse(500, error.message || 'Internal server error');
  }
};