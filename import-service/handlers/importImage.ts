'use strict';

import { handleResponse } from '../utils/handleResponse';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

module.exports.handler = async (event) => {
  const { name } = event.queryStringParameters;

  // Validate if name parameter is provided
  if (!name) return handleResponse(400, 'Name parameter is required');

  try {
    const s3Client = new S3Client([{ apiVersion: "2006-03-01", region: process.env.REGION, signatureVersion: 'v4' }]);
    const command = new PutObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: "images/" + name });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 360 });
    return handleResponse(200, signedUrl);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return handleResponse(500, error.message || 'Internal server error');
  }
};
