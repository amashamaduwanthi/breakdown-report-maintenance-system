# Technician Dashboard - Breakdown Reporting System

A real-time technician dashboard for managing assigned breakdown tasks with email notifications.

## Features

- **Technician Authentication**: Secure login for technicians only
- **Task Management**: View and update assigned breakdown tasks
- **Real-time Updates**: Live synchronization with Firebase database
- **Email Notifications**: Automatic email alerts when tasks are assigned
- **Status Tracking**: Update task status (Approved, In Progress, Resolved)
- **Task Updates**: Add progress notes and updates to tasks

## Quick Start

1. **Clone and Setup**:
   ```bash
   cd breakdown-technician
   npm install
   npm run setup
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Open in browser**: http://localhost:3002

## Setup Instructions

### 1. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and Realtime Database
3. Run `npm run setup` to configure automatically, or manually update `firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
};
```

### 2. EmailJS Configuration

1. Create an account at [EmailJS](https://www.emailjs.com/)
2. Set up an email service (Gmail, Outlook, etc.)
3. Create email templates for task assignments
4. Update `firebase-config.js` with your EmailJS configuration:

```javascript
const emailjsConfig = {
    serviceId: "your-service-id",
    templateId: "your-template-id",
    publicKey: "your-public-key"
};
```

### 3. Firebase Security Rules

Update your Firebase Realtime Database rules to allow technician access:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "breakdowns": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$breakdownId": {
        ".read": "auth != null && (data.child('assignedTechnician/uid').val() == auth.uid || root.child('users').child(auth.uid).child('role').val() == 'manager')",
        ".write": "auth != null && (data.child('assignedTechnician/uid').val() == auth.uid || root.child('users').child(auth.uid).child('role').val() == 'manager')"
      }
    }
  }
}
```

### 4. Email Templates

Create the following email templates in EmailJS:

#### Task Assignment Template
- **Template ID**: `task_assignment`
- **Subject**: `New Breakdown Task Assigned - {{task_id}}`
- **Body**:
```
Hello {{technician_name}},

A new breakdown task has been assigned to you:

Task ID: {{task_id}}
Description: {{task_description}}
Reporter: {{reporter_name}} ({{reporter_email}})
Priority: {{priority}}
Created: {{created_at}}

Please log into your technician dashboard to view full details and start working on this task.

Best regards,
Breakdown Reporting System
```

#### Task Update Template
- **Template ID**: `task_update`
- **Subject**: `Task Update - {{task_id}}`
- **Body**:
```
Hello {{technician_name}},

An update has been added to your assigned task:

Task ID: {{task_id}}
Description: {{task_description}}
Update: {{update_message}}
Updated: {{updated_at}}

Please check your dashboard for more details.

Best regards,
Breakdown Reporting System
```

## Usage

### For Technicians

1. **Login**: Use your technician credentials to access the dashboard
2. **View Tasks**: See all assigned breakdown tasks with details
3. **Update Status**: Change task status (Approved → In Progress → Resolved)
4. **Add Updates**: Post progress notes and updates
5. **Real-time Sync**: All changes sync automatically with the database

### For Managers

When assigning tasks to technicians in the manager dashboard, the system will:
1. Update the task assignment in Firebase
2. Send an email notification to the technician
3. The technician will see the new task in their dashboard

## File Structure

```
breakdown-technician/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── app.js             # Main application logic
├── firebase-config.js  # Firebase and EmailJS configuration
├── email-service.js    # Email notification service
└── README.md          # This file
```

## Development

### Local Development

1. Serve the files using a local web server (required for Firebase)
2. Use Python's built-in server: `python -m http.server 8000`
3. Or use Node.js: `npx serve .`
4. Open `http://localhost:8000` in your browser

### Testing

1. Create technician accounts in Firebase Authentication
2. Assign tasks to technicians in the manager dashboard
3. Verify email notifications are sent
4. Test real-time updates between manager and technician dashboards

## Security Considerations

- Only authenticated technicians can access their assigned tasks
- Firebase security rules enforce role-based access control
- Email notifications are sent securely through EmailJS
- All user inputs are properly escaped to prevent XSS attacks

## Troubleshooting

### Common Issues

1. **Firebase not loading**: Check your Firebase configuration
2. **Email not sending**: Verify EmailJS configuration and template IDs
3. **Authentication errors**: Ensure user has 'technician' role in database
4. **Real-time updates not working**: Check Firebase security rules

### Debug Mode

Enable browser console logging to debug issues:
- Check browser console for Firebase errors
- Verify network requests to Firebase
- Test EmailJS configuration in EmailJS dashboard

## Support

For technical support or questions:
1. Check Firebase documentation
2. Review EmailJS documentation
3. Check browser console for error messages
4. Verify all configuration values are correct
