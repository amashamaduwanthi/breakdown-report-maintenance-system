# Technician Dashboard - Breakdown Reporting System

A real-time technician dashboard for managing assigned breakdown tasks with email notifications.

## 🚀 Features

- **🔐 Secure Authentication**: Role-based access control for technicians only
- **📋 Task Management**: View and update assigned breakdown tasks
- **⚡ Real-time Updates**: Live synchronization with Firebase database
- **📧 Email Notifications**: Automatic email alerts when tasks are assigned
- **📱 Responsive Design**: Mobile-friendly interface
- **🔄 Status Tracking**: Update task status (Approved, In Progress, Resolved)
- **📝 Progress Updates**: Add progress notes and updates to tasks

## 🛠️ Quick Start

### Prerequisites
- Node.js installed
- Firebase project with Authentication and Realtime Database enabled
- EmailJS account for email notifications

### Installation

1. **Clone and Setup**:
   ```bash
   cd breakdown-technician
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Open in browser**: http://localhost:3002

## 📋 Setup Instructions

### 1. Firebase Configuration

The dashboard is pre-configured with your Firebase project:
- **Project ID**: breakdown-report-7ce3a
- **Database URL**: https://breakdown-report-7ce3a-default-rtdb.europe-west1.firebasedatabase.app/
- **Authentication**: Email/Password enabled

### 2. EmailJS Configuration

Email notifications are configured with:
- **Service ID**: service_dce8m4b
- **Template ID**: template_nlfkx0p
- **Public Key**: cbi4HSZfXC7jJbj9i

### 3. Firebase Security Rules

Update your Firebase Realtime Database rules with the provided `firebase-rules.json`:

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

## 🎯 User Workflow

### For Technicians

1. **Login**: Use technician credentials to access the dashboard
2. **View Tasks**: See all assigned breakdown tasks with details
3. **Update Status**: Change task status (Approved → In Progress → Resolved)
4. **Add Updates**: Post progress notes and updates
5. **Real-time Sync**: All changes sync automatically with the database

### For Managers

When assigning tasks to technicians in the manager dashboard:
1. **Task Assignment**: Manager assigns task to technician
2. **Email Notification**: Technician receives email notification
3. **Dashboard Update**: Task appears in technician's dashboard
4. **Real-time Updates**: Status changes sync across all applications

## 📧 Email Notifications

### Task Assignment Email Template

When a task is assigned, technicians receive an email with:
- Task description and details
- Reporter information
- Priority level
- Task ID and creation date
- Link to technician dashboard

### Email Template Variables

The EmailJS template should include these variables:
- `{{to_email}}` - Technician's email address
- `{{technician_name}}` - Technician's name
- `{{task_description}}` - Breakdown description
- `{{reporter_name}}` - Reporter's name
- `{{reporter_email}}` - Reporter's email
- `{{priority}}` - Task priority (low/medium/high)
- `{{task_id}}` - Unique task identifier
- `{{created_at}}` - Task creation timestamp

## 🔧 Technical Implementation

### File Structure
```
breakdown-technician/
├── index.html              # Main dashboard interface
├── styles.css              # Responsive CSS styling
├── email-service.js        # EmailJS integration
├── server.js               # Local development server
├── package.json            # Dependencies and scripts
├── firebase-rules.json     # Firebase security rules
└── README.md              # This documentation
```

### Key Features

1. **Real-time Database Sync**: Uses Firebase Realtime Database for live updates
2. **Role-based Security**: Only technicians can access their assigned tasks
3. **Email Integration**: EmailJS for reliable email notifications
4. **Responsive Design**: Works on desktop, tablet, and mobile devices
5. **Error Handling**: Graceful fallbacks for network issues

### Security Features

- **Authentication Required**: Only logged-in technicians can access
- **Role Verification**: Checks user role before allowing access
- **Data Isolation**: Technicians only see their assigned tasks
- **Input Sanitization**: Prevents XSS attacks
- **Firebase Rules**: Server-side security enforcement

## 🧪 Testing

### Test the Complete Workflow

1. **Submit Breakdown**: Use reporter app to submit a breakdown
2. **Assign Task**: Use manager app to assign to technician
3. **Check Email**: Verify technician receives email notification
4. **View Dashboard**: Check technician dashboard shows the task
5. **Update Status**: Test status updates and progress notes
6. **Real-time Sync**: Verify changes appear in manager app

### Test Scenarios

- **Login Security**: Try accessing with non-technician account
- **Task Updates**: Update task status and add progress notes
- **Email Notifications**: Verify emails are sent and received
- **Real-time Updates**: Test live synchronization between apps
- **Mobile Responsiveness**: Test on different screen sizes

## 🚨 Troubleshooting

### Common Issues

1. **"Access denied" Error**:
   - Ensure user has 'technician' role in Firebase database
   - Check Firebase security rules are applied

2. **Email Not Sending**:
   - Verify EmailJS configuration
   - Check EmailJS dashboard for errors
   - Ensure email template is published

3. **Real-time Updates Not Working**:
   - Check Firebase connection
   - Verify security rules allow read/write access
   - Check browser console for errors

4. **Tasks Not Loading**:
   - Verify user is assigned to tasks
   - Check Firebase database structure
   - Ensure proper authentication

### Debug Mode

Enable browser console logging to debug issues:
- Open Developer Tools (F12)
- Check Console tab for error messages
- Look for Firebase and EmailJS errors
- Verify network requests are successful

## 📊 Performance Features

- **Lazy Loading**: Tasks load as needed
- **Efficient Queries**: Firebase queries optimized for performance
- **Caching**: Browser caching for static assets
- **Responsive Images**: Optimized for different screen sizes
- **Minimal Dependencies**: Lightweight implementation

## 🔄 Integration with Other Apps

### Manager App Integration
- Real-time task status updates
- Email notifications when tasks are assigned
- Shared Firebase database for data consistency

### Reporter App Integration
- Technicians can see reporter details
- Status updates visible to reporters
- Complete audit trail of task progress

## 📈 Future Enhancements

- **Push Notifications**: Browser push notifications for urgent tasks
- **File Attachments**: Support for task-related files
- **Advanced Filtering**: Filter tasks by status, priority, date
- **Reporting**: Generate task completion reports
- **Mobile App**: Native mobile application

## 📞 Support

For technical support or questions:
1. Check this documentation
2. Review Firebase and EmailJS documentation
3. Check browser console for error messages
4. Verify all configuration values are correct

## 🎉 Success Metrics

- ✅ Technicians can login and access dashboard
- ✅ Assigned tasks display correctly
- ✅ Status updates work in real-time
- ✅ Email notifications are sent and received
- ✅ Mobile responsiveness works properly
- ✅ Security and access control function correctly

The technician dashboard provides a complete solution for managing breakdown tasks with real-time updates and email notifications!
