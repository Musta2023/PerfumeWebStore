import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js'; 
dotenv.config();

export const protectRoute= async (req,res,next)=>{
    const incomingAccessToken=req.cookies?.accessToken;         
    if(!incomingAccessToken){
        return res.status(401).json({message:"Access token missing. Please login"});
    }
    try {
        const decoded=jwt.verify(incomingAccessToken,process.env.JWT_SECRET,{ clockTolerance: 5 }); //{userId, jti, iat, exp}
        const user= await User.findById(decoded.userId).select("-password").lean();
        if(!user){
            return res.status(401).json({message:"User not found. Invalid access token"});
        }
        req.user=user;
        req.userId=decoded.userId;
        return next();
    } catch (error) {
        return res.status(401).json({message:error.name==='TokenExpiredError' ?
          "Access token expired. Please login again" :
          "Invalid access token. Please login"});
    }   
};

export const adminRoute = (req, res, next) =>{
    if(req.user&& req.user.role==="admin"){
        return next();
    }else{
        return res.status(403).json({message:"Access denied. Admins only"});
    }

}