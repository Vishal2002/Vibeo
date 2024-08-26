import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config()


mongoose.connect(process.env.MONGO_URL as string)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });


  const VideoSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: String,
    description: {type:String},
    s3Url: {type: String},
    thumbnailUrl: {type:String},
    subtitlesUrl: {type:String},
    transcodedUrls: [{
      resolution: String,
      url: String
    }],
    segmentsUrl:String,
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'failed'],
      default: 'uploaded'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

const UserSchema=new mongoose.Schema({
  username:{type:String,required:true,unique:true},
  email:{type:String,required:true,unique:true},
  password:{type:String,required:true},
  isVerified:{type:Boolean,default:false},
  isDeleted: { type: Boolean, default: false },
  role:{type:String,enum:['user','super-admin'],default:'user'},
  freeTrialsRemaining: { type: Number, default: 5 },
  currentPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
},{timestamps:true});

const PlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  monthlyPrice: { type: Number, required: true },
  yearlyPrice: { type: Number, required: true },
  features: [String],
  duration: { type: String, 
    enum:['monthly','yearly'],
    required: true },
  
}, { timestamps: true });

const SubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });



export const video = mongoose.model('video', VideoSchema);
export const subscription=mongoose.model('subscription', SubscriptionSchema);
export const user = mongoose.model('user', UserSchema);
export const plan = mongoose.model('plan', PlanSchema);

  


