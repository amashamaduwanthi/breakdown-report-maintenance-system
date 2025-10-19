// Alternative email service using webhook approach
// This can be used while EmailJS account is blocked

interface TaskAssignmentParams {
  technicianEmail: string;
  technicianName: string;
  taskDescription: string;
  reporterName: string;
  reporterEmail: string;
  priority: string;
  taskId: string;
  createdAt: string;
}

class AlternativeEmailService {
  private webhookUrl = 'https://your-email-webhook.com/send'; // Replace with your webhook URL
  private apiKey = 'your-api-key'; // Replace with your API key

  async sendTaskAssignmentEmail(params: TaskAssignmentParams): Promise<boolean> {
    try {
      console.log('📧 Sending email via webhook...', params);
      
      const emailData = {
        to: params.technicianEmail,
        subject: `New Task Assigned: ${params.taskDescription}`,
        template: 'task-assignment',
        data: {
          technician_name: params.technicianName,
          task_description: params.taskDescription,
          reporter_name: params.reporterName,
          reporter_email: params.reporterEmail,
          priority: params.priority,
          task_id: params.taskId,
          created_at: params.createdAt
        }
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Email sent successfully via webhook:', result);
      return true;

    } catch (error) {
      console.error('❌ Error sending email via webhook:', error);
      return false;
    }
  }

  // Simple console notification as fallback
  async sendConsoleNotification(params: TaskAssignmentParams): Promise<boolean> {
    console.log('📧 EMAIL NOTIFICATION (Console Fallback)');
    console.log('==========================================');
    console.log(`To: ${params.technicianEmail}`);
    console.log(`Subject: New Task Assigned: ${params.taskDescription}`);
    console.log('');
    console.log(`Hello ${params.technicianName},`);
    console.log('');
    console.log('A new breakdown task has been assigned to you:');
    console.log('');
    console.log(`Task ID: ${params.taskId}`);
    console.log(`Description: ${params.taskDescription}`);
    console.log(`Reporter: ${params.reporterName} (${params.reporterEmail})`);
    console.log(`Priority: ${params.priority}`);
    console.log(`Created: ${params.createdAt}`);
    console.log('');
    console.log('Please log into your technician dashboard to view full details.');
    console.log('');
    console.log('Best regards,');
    console.log('Breakdown Reporting System');
    console.log('==========================================');
    
    return true;
  }
}

export const alternativeEmailService = new AlternativeEmailService();
export default alternativeEmailService;
