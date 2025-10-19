// EmailJS service for sending technician notifications
class EmailService {
    constructor() {
        this.isInitialized = false;
        this.config = {
            serviceId: 'service_13xst74',
            templateId: 'template_vp34whe',
            publicKey: 'IplMJPtelGI6fL9UO'
        };
        this.init();
    }

    async init() {
        try {
            // Initialize EmailJS
            if (typeof emailjs !== 'undefined') {
                emailjs.init(this.config.publicKey);
                this.isInitialized = true;
                console.log('✅ EmailJS initialized successfully');
            } else {
                console.error('❌ EmailJS not loaded');
            }
        } catch (error) {
            console.error('❌ Error initializing EmailJS:', error);
        }
    }

    async sendTaskAssignmentEmail(technicianEmail, taskDetails) {
        if (!this.isInitialized) {
            console.error('❌ EmailJS not initialized');
            return false;
        }

        try {
            const templateParams = {
                to_email: technicianEmail,
                technician_name: taskDetails.assignedTechnician.name,
                task_description: taskDetails.message,
                reporter_name: taskDetails.reporterName,
                reporter_email: taskDetails.reporterEmail,
                priority: taskDetails.priority,
                task_id: taskDetails.id,
                created_at: new Date(taskDetails.timestamps?.createdAt).toLocaleString() || new Date().toLocaleString()
            };

            console.log('📧 Sending task assignment email...', templateParams);

            const result = await emailjs.send(
                this.config.serviceId,
                this.config.templateId,
                templateParams
            );

            console.log('✅ Task assignment email sent successfully:', result);
            return true;
        } catch (error) {
            console.error('❌ Error sending task assignment email:', error);
            return false;
        }
    }

    async sendTaskUpdateEmail(technicianEmail, taskDetails, updateMessage) {
        if (!this.isInitialized) {
            console.error('❌ EmailJS not initialized');
            return false;
        }

        try {
            const templateParams = {
                to_email: technicianEmail,
                technician_name: taskDetails.assignedTechnician.name,
                task_description: taskDetails.message,
                update_message: updateMessage,
                task_id: taskDetails.id,
                updated_at: new Date().toLocaleString()
            };

            console.log('📧 Sending task update email...', templateParams);

            const result = await emailjs.send(
                this.config.serviceId,
                'task_update_template', // Different template for updates
                templateParams
            );

            console.log('✅ Task update email sent successfully:', result);
            return true;
        } catch (error) {
            console.error('❌ Error sending task update email:', error);
            return false;
        }
    }

    // Console notification fallback
    sendConsoleNotification(technicianEmail, taskDetails, type = 'assignment') {
        console.log('📧 EMAIL NOTIFICATION (Console Fallback)');
        console.log('==========================================');
        console.log(`To: ${technicianEmail}`);
        
        if (type === 'assignment') {
            console.log(`Subject: New Task Assigned: ${taskDetails.message}`);
            console.log('');
            console.log(`Hello ${taskDetails.assignedTechnician.name},`);
            console.log('');
            console.log('A new breakdown task has been assigned to you:');
            console.log('');
            console.log(`Task ID: ${taskDetails.id}`);
            console.log(`Description: ${taskDetails.message}`);
            console.log(`Reporter: ${taskDetails.reporterName} (${taskDetails.reporterEmail})`);
            console.log(`Priority: ${taskDetails.priority}`);
            console.log(`Created: ${new Date(taskDetails.timestamps?.createdAt).toLocaleString()}`);
        } else if (type === 'update') {
            console.log(`Subject: Task Update: ${taskDetails.message}`);
            console.log('');
            console.log(`Hello ${taskDetails.assignedTechnician.name},`);
            console.log('');
            console.log('An update has been added to your assigned task:');
            console.log('');
            console.log(`Task ID: ${taskDetails.id}`);
            console.log(`Description: ${taskDetails.message}`);
            console.log(`Update: ${taskDetails.updateMessage}`);
            console.log(`Updated: ${new Date().toLocaleString()}`);
        }
        
        console.log('');
        console.log('Please log into your technician dashboard to view full details.');
        console.log('');
        console.log('Best regards,');
        console.log('Breakdown Reporting System');
        console.log('==========================================');
    }
}

// Create global instance
const emailService = new EmailService();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailService;
} else {
    window.EmailService = EmailService;
    window.emailService = emailService;
}
