import mongoose from 'mongoose';

// One document per website-content section (see src/content/schema.js), e.g. 'home', 'general', 'facilities'.
// `value` holds only what was saved in the dashboard; it is merged over src/content/defaults.js when read.
const SiteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, minimize: false }
);

export default mongoose.models.SiteContent || mongoose.model('SiteContent', SiteContentSchema);
