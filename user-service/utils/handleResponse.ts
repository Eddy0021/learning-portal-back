import dotenv from 'dotenv';

dotenv.config();

export const handleResponse = (statusCode: number, message: string) => {
    return {
      statusCode,
      headers: {
        'Access-Control-Allow-Origin': process.env.FRONT_URL,
        'Access-Control-Allow-Credentials': true
      },
      body: message,
    };
  }
  