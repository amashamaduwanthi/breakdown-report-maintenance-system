// EmailJS service for sending notifications
class EmailService {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Initialize EmailJS
            if (typeof emailjs !== 'undefined') {
                emailjs.init(emailjsConfig.publicKey);
                this.isInitialized = true;
                console.log('EmailJS initialized successfully');
            } else {
                console.error('EmailJS not loaded');
            }
        } catch (error) {
            console.error('Error initializing EmailJS:', error);
        }
    }

/* <<<<<<<<<<<<<<  ✨ Windsurf Command ⭐ >>>>>>>>>>>>>>>> */
    /**
     * Sends a task assignment email notification to the technician
     * @param {string} technicianEmail - Email address of the technician
     * @param {object} taskDetails - Task details object containing:
     *   - assignedTechnician: object containing technician name and email
     *   - message: string describing the task
     *   - reporterName: string containing the name of the reporter
     *   - reporterEmail: string containing the email of the reporter
     *   - priority: string containing the priority of the task
     *   - id: string containing the unique ID of the task
     *   - timestamps: object containing createdAt and updatedAt timestamps
     * @returns {Promise<boolean>} - Returns true if the email was sent successfully, false otherwise
     */
/* <<<<<<<<<<  2fe6d878-05f8-4416-ab9f-db7e3861528d  >>>>>>>>>>> */
    async sendTaskAssignmentEmail(technicianEmail, taskDetails) {
        if (!this.isInitialized) {
            console.error('EmailJS not initialized');
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
                created_at: new Date(taskDetails.timestamps?.createdAt).toLocaleString()
            };

            const result = await emailjs.send(
                emailjsConfig.serviceId,
                emailjsConfig.templateId,
                templateParams
            );

            console.log('Email sent successfully:', result);
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    }

    async sendTaskUpdateEmail(technicianEmail, taskDetails, updateMessage) {
        if (!this.isInitialized) {
            console.error('EmailJS not initialized');
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

            const result = await emailjs.send(
                emailjsConfig.serviceId,
                'task_update_template', // Different template for updates
                templateParams
            );

            console.log('Update email sent successfully:', result);
            return true;
        } catch (error) {
            console.error('Error sending update email:', error);
            return false;
        }
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

