import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  userId: String,
  name: String,
  checked: Boolean
});

export default mongoose.models.User || mongoose.model('User', UserSchema);