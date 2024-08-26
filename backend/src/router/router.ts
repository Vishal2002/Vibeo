import express from 'express'
import {upload} from '../middleware/upload';
import { uploadVideo,register,login,subscribePlan,createPaymentIntent, createPlan,getVideo } from '../controller/controller';
import { authenticate, processVideo } from '../middleware/helper';
import { checkPermission } from '../middleware/authMiddleware';
export const router= express.Router();



router.route('/upload').post(processVideo,upload.single('video'),uploadVideo);

router.route('/auth/signup').post(register);

router.route('/auth/login').post(login);
router.route('/createPlan').post(checkPermission('super-admin'),createPlan);
router.route('/create-payment-intent/:planId').post(authenticate, createPaymentIntent);
router.route('/video/:videoId').get(checkPermission('user'),getVideo);
router.route('/subscribe').post(authenticate,subscribePlan);



