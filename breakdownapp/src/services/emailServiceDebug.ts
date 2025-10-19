// Debug version of EmailJS service to help identify issues
import emailjs from '@emailjs/browser';

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

class EmailServiceDebug {
  private config = {
    serviceId: 'service_dce8m4b',
    templateId: 'template_nlfkx0p',
    publicKey: 'cbi4HSZfXC7jJbj9i'
  };

  async debugEmailJS() {
    console.log('🔍 Debugging EmailJS Configuration...');
    console.log('Config:', this.config);
    
    try {
      // Initialize EmailJS
      emailjs.init(this.config.publicKey);
      console.log('✅ EmailJS initialized successfully');
      
      // Test with minimal parameters first
      const testParams = {
        to_email: 'test@example.com',
        technician_name: 'Test Technician',
        task_description: 'Test task description',
        reporter_name: 'Test Reporter',
        reporter_email: 'reporter@example.com',
        priority: 'Medium',
        task_id: 'TEST-123',
        created_at: new Date().toLocaleString()
      };
      
      console.log('📧 Test parameters:', testParams);
      
      const result = await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        testParams
      );
      
      console.log('✅ Email sent successfully:', result);
      return true;
      
    } catch (error: any) {
      console.error('❌ EmailJS Error:', error);
      console.error('Error Status:', error.status);
      console.error('Error Text:', error.text);
      console.error('Error Message:', error.message);
      
      // Common issues and solutions
      if (error.status === 400) {
        console.log('🔧 Possible solutions for 400 error:');
        console.log('1. Check if template parameters match your EmailJS template');
        console.log('2. Verify your EmailJS template exists and is published');
        console.log('3. Check if your EmailJS service is properly configured');
        console.log('4. Verify your EmailJS public key is correct');
        console.log('5. Check if your email template has all required variables');
      }
      
      return false;
    }
  }

  async sendTaskAssignmentEmail(params: TaskAssignmentParams): Promise<boolean> {
    console.log('📧 Sending task assignment email...');
    console.log('Parameters:', params);
    
    try {
      emailjs.init(this.config.publicKey);
      
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
      
      console.log('📤 Sending with parameters:', templateParams);
      
      const result = await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        templateParams
      );
      
      console.log('✅ Email sent successfully:', result);
      return true;
      
    } catch (error: any) {
      console.error('❌ Error sending email:', error);
      console.error('Status:', error.status);
      console.error('Text:', error.text);
      console.error('Message:', error.message);
      return false;
    }
  }
}

export const emailServiceDebug = new EmailServiceDebug();
export default emailServiceDebug;
