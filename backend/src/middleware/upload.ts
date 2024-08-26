import multer from 'multer';
import multerS3 from 'multer-s3';
import { AWS } from '../service/s3';
import {Request} from 'express';
import dotenv from 'dotenv';
import jwt,{JwtPayload} from 'jsonwebtoken';
dotenv.config();



const MAX_SIZE_NON_SUBSCRIBED = 100 * 1024 * 1024; 

const fileFilter = (req:Request, file:any, cb:any) => {
  
  const token = req.headers.authorization?.split(' ')[1] || null;
  //@ts-ignore
  const decoded = jwt.decode(token) as JwtPayload
  const isSubscribed = decoded?.isSubscribed || false;

  if (isSubscribed) {
    cb(null, true);
  } else {
    if (file.size > MAX_SIZE_NON_SUBSCRIBED) {
      cb(new Error('File too large. Max size is 100MB for non-subscribed users.'), false);
    } else {
      cb(null, true);
    }
  }
};

export const upload = multer({
  storage: multerS3({
    s3: AWS,
    bucket: process.env.BUCKET as string,
    key: function (req, file, cb) {
      cb(null, `upload/Videos/${file.originalname}`);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_SIZE_NON_SUBSCRIBED,
  }
});