import { Schema, model, models, type Document, Model } from 'mongoose';

interface UserProtocol {
  email: string;
  password: string;
}

export interface UserDocumentType extends UserProtocol, Document {}

const UserSchema = new Schema<UserDocumentType>({
  email: { type: String, required: true },
  password: { type: String, required: true },
});

const UserModel: Model<UserDocumentType> =
  models.KrakenUsers || model<UserDocumentType>('KrakenUsers', UserSchema); // eslint-disable-line

export default UserModel;
