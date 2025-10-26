import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  linkedinId: string;
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  headline?: string;
  summary?: string;
  positions?: any[];
  educations?: any[];
  skills?: any[];
  rawProfileData: any;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    linkedinId: {
      type: String,
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    headline: {
      type: String,
    },
    summary: {
      type: String,
    },
    positions: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    educations: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    skills: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    rawProfileData: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);
