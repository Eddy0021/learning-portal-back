'use strict';

import { changePassword } from '../databaseServices/dynamodbService';
import { handleResponse } from '../utils/handleResponse';

export const handler = async (event: any) => {
  try {
    // Parse the request body to extract product data
    const { user_id, currentPassword, newPassword, confirmNewPassword } = JSON.parse(event.body || '');

    const response = await changePassword(user_id, currentPassword, newPassword, confirmNewPassword);

    return handleResponse(200, response);
  } catch (error) {
    console.error('Error:', error);
    return handleResponse(500, error);
  }
};
