// EmailJS service for sending notifications
import emailjs from '@emailjs/browser';

interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

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

class EmailService {
  private isInitialized = false;
  private config: EmailConfig;

  constructor() {
    // Use the configuration from firebase-config.js
    this.config = {
      serviceId: 'service_dce8m4b',
      templateId: 'template_nlfkx0p',
      publicKey: 'cbi4HSZfXC7jJbj9i'
    };
    this.init();
  }

  private async init() {
    try {
      emailjs.init(this.config.publicKey);
      this.isInitialized = true;
      console.log('EmailJS initialized successfully');
    } catch (error) {
      console.error('Error initializing EmailJS:', error);
    }
  }

  async sendTaskAssignmentEmail(params: TaskAssignmentParams): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('EmailJS not initialized');
      return false;
    }

    // Validate required parameters
    if (!params.technicianEmail || !params.technicianName) {
      console.error('Missing required parameters for email:', params);
      return false;
    }

    try {
      const templateParams = {
        to_email: params.technicianEmail,
        technician_name: params.technicianName,
        task_description: params.taskDescription || 'No description provided',
        reporter_name: params.reporterName || 'Unknown Reporter',
        reporter_email: params.reporterEmail || 'No email provided',
        priority: params.priority || 'Medium',
        task_id: params.taskId || 'Unknown ID',
        created_at: params.createdAt || new Date().toLocaleString()
      };

      console.log('Sending email with parameters:', {
        serviceId: this.config.serviceId,
        templateId: this.config.templateId,
        templateParams
      });

      const result = await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        templateParams
      );

      console.log('Task assignment email sent successfully:', result);
      return true;
    } catch (error: any) {
      console.error('Error sending task assignment email:', error);
      console.error('Error details:', {
        status: error.status,
        text: error.text,
        message: error.message
      });
      return false;
    }
  }

  async sendTaskUpdateEmail(
    technicianEmail: string,
    technicianName: string,
    taskDescription: string,
    updateMessage: string,
    taskId: string
  ): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('EmailJS not initialized');
      return false;
    }

    try {
      const templateParams = {
        to_email: technicianEmail,
        technician_name: technicianName,
        task_description: taskDescription,
        update_message: updateMessage,
        task_id: taskId,
        updated_at: new Date().toLocaleString()
      };

      const result = await emailjs.send(
        this.config.serviceId,
        'task_update_template', // Different template for updates
        templateParams
      );

      console.log('Task update email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Error sending task update email:', error);
      return false;
    }
  }
}

// Create and export singleton instance
export const emailService = new EmailService();
export default emailService;

