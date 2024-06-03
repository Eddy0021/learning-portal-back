'use strict';

import { createTraining } from '../databaseServices/dynamodbService';
import { handleResponse } from '../utils/handleResponse';

export const handler = async (event: any) => {
  try {
    // Parse the request body to extract product data
    const training = JSON.parse(event.body || '');

    const response = await createTraining(training);

    // Return a success response with the newly created product ID
    return handleResponse(200, JSON.stringify(response));
  } catch (error) {
    console.error('Error:', error);
    return handleResponse(500, error);
  }
};
