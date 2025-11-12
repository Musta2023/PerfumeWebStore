import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please provide name"],
        maxLength:[40,"Name should not exceed 40 characters"],
        minLength: [3, "Name should be at least 3 characters"],
        trim: true
    },
    email:{
        type:String,
        required:[true,"Please provide email"],
        unique:true,
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        required:[true,"Please provide password"],
        minLength:[6,"Password should be at least 6 characters"]
    },
    role:{
            type:String,
            enum:["customer","admin"],
            default:"customer",
            required: true // Ensure role is required
        },
    cartItems:[{
        quantity:{
            type:Number,
            default:1,
        },
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Product"
        },
      
    }]
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    try {
        if (!this.isModified('password')) return next();
        
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function (password){
    return await bcrypt.compare(password, this.password);
}


const User=mongoose.model("User",userSchema);
export default User;
