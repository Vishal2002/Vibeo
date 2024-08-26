import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
dotenv.config();
export const AWS = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_KEY as string,
  },
});

export async function deleteFromS3(url:string) {
  const urlParts = new URL(url);
  const bucket = urlParts.hostname.split('.')[0];
  let key = urlParts.pathname.substring(1);
  key = decodeURIComponent(key);

  const params = {
    Bucket: bucket,
    Key: key,
  };

  await AWS.send(new DeleteObjectCommand(params));
}

