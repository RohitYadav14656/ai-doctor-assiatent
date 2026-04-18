import mongoose from 'mongoose';

const connectdb=async()=>{
  try {
      await mongoose.connect("mongodb+srv://root:rohit@cluster0.4vgqa8n.mongodb.net/Aichatapp").then(()=>{
        console.log("DB connected");
      }).catch((error)=>{
        console.log("DB connection error",error);
      });
    } catch (error) {
      console.log("Error in DB connection",error);
    }
}

export default connectdb;