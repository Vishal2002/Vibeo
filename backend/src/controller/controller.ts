import { video,user,subscription,plan } from "../db/db";
import { deleteFromS3 } from "../service/s3";
import { Request,Response } from "express";
import { addToQueue } from "../service/queue";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/helper";
import Stripe from "stripe";
import { JwtPayload } from "../middleware/helper";
dotenv.config()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const createPaymentIntent = async (req: AuthRequest, res: Response) => {
  try {
    const { planId } = req.params;
    const userId = req.user?.id;
    const {pricing} =req.body
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const Plan = await plan.findById(planId);
    if (!Plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount:pricing=='monthly'?Plan.monthlyPrice * 100:Plan.yearlyPrice * 100,
      currency: 'usd',
      metadata: { planId: planId, userId: userId },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Payment Intent Creation Error", error);
    res.status(500).send("Internal Server Error");
  }
};

export const uploadVideo=async(req:Request,res:Response)=>{
  try {
    //@ts-ignore
    const {location}=req.file;
    const token = req.headers.authorization?.split(' ')[1] || null;
  const decoded = token ? jwt.decode(token) as JwtPayload : null;
    if(!location){
        res.send("Please upload a Video before Starting processing video");
    }
   const s3Url = location;
    const newVideo = await video.create({
        userId: decoded?.userId,
        title: req.body.title || 'Untitled',
        description: req.body.description || '',
        s3Url,
        status: 'uploaded'
      });
  
      // Add to Redis Queue for processing
      await addToQueue({
        //@ts-ignore;
        userId:decoded?.userId,
        videoId: newVideo._id.toString(),
        s3Url
      });
  
      res.status(201).json({
        message: "Video uploaded successfully and queued for processing",
        videoId: newVideo._id
      });

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");

  }
  }

export const register = async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;
  
      // Check if user already exists
      const existingUser = await user.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
  
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // Create new user
      const newUser = new user({
        username,
        email,
        password: hashedPassword
      });
  
      // Save user to database
      await newUser.save();
  
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Signup Error", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
export const 
login = async (req:AuthRequest, res: Response) => {
    try {
      const { email, password } = req.body;
  
      const User = await user.findOne({ email });
      if (!User) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
  
      const isMatch = await bcrypt.compare(password, User.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      const token = jwt.sign({ userId: User._id, email: User.email,role:User.role,  freeTrialsRemaining: User.freeTrialsRemaining , isSubscribed:User.currentPlan?true:false}, process.env.JWT_SECRET as string, { expiresIn: '24h' });
      
    
      res.status(200).json({ freeTrialsRemaining: User.freeTrialsRemaining ,token, message: "Login successful"});
  
    } catch (error) {
      console.error("Login Error", error);
      res.status(500).send("Internal Server Error");
    }
  };

export const getVideo=async(req:AuthRequest, res:Response)=>{
  try {
   
    const token = req.headers.authorization?.split(' ')[1] || null;
    const decoded = token ? jwt.decode(token) as JwtPayload : null;
    if(!token){
      return res.status(403).json({message:"Token not found"});
    }
   
    const videos = await video.findOne({
      userId: decoded?.userId,
      _id: req.params.videoId,  
    }).lean();

    if (!videos) {
      return res.status(404).json({ message: "No processed videos found" });
    }

    res.status(200).json(videos);

    
  } catch (error) {
    console.error("GetVideo Error", error);
    res.status(500).send("Internal Server Error");
  }
}
  
  
export const subscribePlan = async (req: AuthRequest, res: Response) => {
    try {
      const { paymentIntentId,pricing } = req.body;
      const userId = req.user?.id;
  
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      // Retrieve the payment intent to confirm it's successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not successful" });
      }
  
      const planId = paymentIntent.metadata.planId;
  
      const Plan = await plan.findById(planId);
      if (!Plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
  
      const User = await user.findById(userId);
      if (!User) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const startDate = new Date();
      let endDate = new Date(startDate);
      if (pricing === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (pricing === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
  
      const newSubscription = new subscription({
        user: userId,
        plan: planId,
        startDate,
        endDate,
        isActive: true
      });
  
      await newSubscription.save();
  
      User.currentPlan = new mongoose.Types.ObjectId(planId);
      await User.save();
  
      res.status(200).json({ 
        message: "Successfully subscribed to the plan",
        subscription: newSubscription
      });
  
    } catch (error) {
      console.error("Subscription Error", error);
      res.status(500).send("Internal Server Error");
    }
  };

export const createPlan=async(req: Request, res: Response)=>{
  try {
    const { name,monthlyPrice,yearlyPrice, features, duration } = req.body;
    if (!name || !monthlyPrice || !yearlyPrice ||!duration) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!['monthly', 'yearly'].includes(duration)) {
      return res.status(400).json({ message: "Invalid duration. Must be 'monthly' or 'yearly'" });
    }

    const newPlan = new plan({
      name,
      monthlyPrice,
      yearlyPrice,
      features: features || [],
      duration
    });

  
    await newPlan.save();

    res.status(201).json({
      message: "Plan created successfully",
      plan: newPlan
    });
    
  } catch (error) {
    console.error("Error creating plan", error);
    res.status(500).send("Internal Server Error");
  }
}









