import { NextFunction, Request,Response } from "express";
import { user,subscription } from "../db/db";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();

// Extend the Request type to include the user property
export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}
export interface JwtPayload {
  userId: string;
  isSubscribed?: boolean;
}



export const authenticate = async(req: AuthRequest, res: Response, next: NextFunction)=>{
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {

    return res.status(401).json({ message: "No token provided." });
  }

  try {
    const decoded =jwt.verify(token,process.env.JWT_SECRET as string) as JwtPayload;
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }
}




export const processVideo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1] || null;
  const decoded = token ? jwt.decode(token) as JwtPayload : null;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  
   const userId=decoded?.userId;
  try {
    const User = await user.findById(userId);
    if (!User) {
      return res.status(404).json({ message: "User not found" });
    }
    const isSubscribed = decoded?.isSubscribed || false;

    if (isSubscribed) {
    
      next();
    } else if (User.freeTrialsRemaining > 0) {
      if (req.file && req.file.size > 100 * 1024 * 1024) {
        return res.status(413).json({ message: "File too large. Max size is 100MB for non-subscribed users." });
      }
      User.freeTrialsRemaining--;
      await User.save();
      next();
    } else {
      const activeSubscription = await subscription.findOne({
        user: User._id,
        isActive: true,
        endDate: { $gt: new Date() }
      });

      if (activeSubscription) {
        next();
      } else {
        res.status(403).json({ message: "Please subscribe to continue using the service or to upload larger files." });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};