import mongoose from 'mongoose';

export const CONTACT_STATUSES = ['unread', 'read', 'replied', 'archived'];
export const EMAIL_STATES = ['pending', 'sent', 'failed', 'off'];

// Messages sent from the Contact page (Dashboard → Messages)
const ContactMessageSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, required: [true, 'Email is required'], trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, default: '' },
    message: { type: String, required: [true, 'Message is required'], trim: true },
    status: { type: String, enum: CONTACT_STATUSES, default: 'unread', index: true },
    // Private note for the office (e.g. "called back on Sunday")
    note: { type: String, trim: true, default: '' },
    // Email delivery: notification to the school and confirmation to the sender
    emailAdmin: { type: String, enum: EMAIL_STATES, default: 'pending' },
    emailSender: { type: String, enum: EMAIL_STATES, default: 'pending' },
    emailError: { type: String, default: '' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    page: { type: String, default: '' },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

ContactMessageSchema.index({ createdAt: -1 });

export default mongoose.models.ContactMessage || mongoose.model('ContactMessage', ContactMessageSchema);
