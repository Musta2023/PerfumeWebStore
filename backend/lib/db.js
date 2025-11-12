import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
       const conn= await mongoose.connect(process.env.MONGO_URL )
       console.log(`MongoDB cloud in connected: ${conn.connection.host}`);
        
    } catch (error) {
        console.log(`error connecting mongo DB: ${error.message}`);
        process.exit(1);        
    }
}
