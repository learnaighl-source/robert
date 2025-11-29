import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  checked: {
    type: Boolean,
    default: false
  }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);