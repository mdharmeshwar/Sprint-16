import { Schema, model } from 'mongoose';

const projectSchema = new Schema({
  name: { type: String, required: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default model('Project', projectSchema);
