'use strict';

import { verifyUser } from '../databaseServices/dynamodbService';
import { handleResponse } from '../utils/handleResponse';

export const handler = async (event: any) => {
  try {
    if (!event.headers || !event.headers.authorization) {
      console.error('Error: Unauthorized');
      return handleResponse(401, 'Unauthorized')
    }

    const response = await verifyUser(event.headers.authorization);

    return response;
  } catch (error) {
    console.error('Error:', error);
    return handleResponse(500, error);
  }
};
