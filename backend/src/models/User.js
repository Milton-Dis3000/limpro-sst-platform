import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { USER_ROLES } from "../utils/constants.js";

const userSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    rol: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CONSULTOR
    },
    estado: {
      type: String,
      enum: ["activo", "inactivo", "suspendido"],
      default: "activo"
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
