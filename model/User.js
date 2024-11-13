import mongoose from "mongoose";
const user = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
    default: "",
  },
  googleToken: {
    type: String,
    required: false,
    default: "",
  },
  cart: {
    type: Array,
    default: [],
  },
});

export const User = mongoose.model("User_Data", user);
