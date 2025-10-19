// Firebase configuration
// Replace these values with your actual Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAdibg6llB7PBhVd_VL35FaOtTnAB9w0TQ",
    authDomain: "breakdown-report-7ce3a.firebaseapp.com",
    databaseURL: "https://breakdown-report-7ce3a-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "breakdown-report-7ce3a",
    storageBucket: "breakdown-report-7ce3a.firebasestorage.app",
    messagingSenderId: "957822686255",
    appId: "1:957822686255:web:107e975d62de1efe54e2da"
};

// EmailJS configuration
const emailjsConfig = {
    serviceId: "service_13xst74",
    templateId: "template_vp34whe",
    publicKey: "IplMJPtelGI6fL9UO"
};

// Export configurations
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { firebaseConfig, emailjsConfig };
} else {
    window.firebaseConfig = firebaseConfig;
    window.emailjsConfig = emailjsConfig;
}

