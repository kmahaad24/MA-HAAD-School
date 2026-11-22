// Admin dashboard counters
import { ok } from '@/server/http';
import { countUsers } from '@/server/services/user.service';
import ContactMessage from '@/models/ContactMessage';
import AdmissionApplication from '@/models/AdmissionApplication';

export async function overview() {
  const [users, messages, unreadMessages, recentMessages, applications, newApplications] = await Promise.all([
    countUsers(),
    ContactMessage.estimatedDocumentCount(),
    ContactMessage.countDocuments({ status: 'unread' }),
    ContactMessage.find().sort({ createdAt: -1 }).limit(5).lean(),
    AdmissionApplication.estimatedDocumentCount(),
    AdmissionApplication.countDocuments({ status: 'new' }),
  ]);
  return ok({ users, messages, unreadMessages, applications, newApplications, recentMessages: JSON.parse(JSON.stringify(recentMessages)) });
}
