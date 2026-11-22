import mongoose from 'mongoose';

export const ADMISSION_STATUSES = ['new', 'contacted', 'admitted', 'rejected'];
export const ADMISSION_EMAIL_STATES = ['pending', 'sent', 'failed', 'off'];

// Online admission applications sent from /admission/apply (Dashboard → Admission Applications)
const AdmissionApplicationSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: [true, 'Student name is required'], trim: true },
    className: { type: String, required: [true, 'Class is required'], trim: true },
    fatherName: { type: String, required: [true, 'Father’s name is required'], trim: true },
    motherName: { type: String, required: [true, 'Mother’s name is required'], trim: true },
    mobile: { type: String, required: [true, 'Mobile number is required'], trim: true },
    status: { type: String, enum: ADMISSION_STATUSES, default: 'new', index: true },
    // Private note for the office (e.g. "called, visiting on Sunday")
    note: { type: String, trim: true, default: '' },
    // Email alert to the admin address(es) in Settings → Email
    emailAdmin: { type: String, enum: ADMISSION_EMAIL_STATES, default: 'pending' },
    emailError: { type: String, default: '' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

AdmissionApplicationSchema.index({ createdAt: -1 });

export default mongoose.models.AdmissionApplication || mongoose.model('AdmissionApplication', AdmissionApplicationSchema);
