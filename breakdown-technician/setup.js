// Setup script for Technician Dashboard
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('🔧 Technician Dashboard Setup');
  console.log('=============================\n');
  
  console.log('This script will help you configure Firebase and EmailJS for the technician dashboard.\n');
  
  // Firebase Configuration
  console.log('📱 Firebase Configuration');
  console.log('-------------------------');
  const firebaseApiKey = await question('Firebase API Key: ');
  const firebaseAuthDomain = await question('Firebase Auth Domain: ');
  const firebaseDatabaseURL = await question('Firebase Database URL: ');
  const firebaseProjectId = await question('Firebase Project ID: ');
  const firebaseStorageBucket = await question('Firebase Storage Bucket: ');
  const firebaseMessagingSenderId = await question('Firebase Messaging Sender ID: ');
  const firebaseAppId = await question('Firebase App ID: ');
  
  console.log('\n📧 EmailJS Configuration');
  console.log('-------------------------');
  const emailjsServiceId = await question('EmailJS Service ID: ');
  const emailjsTemplateId = await question('EmailJS Template ID: ');
  const emailjsPublicKey = await question('EmailJS Public Key: ');
  
  // Update firebase-config.js
  const configContent = `// Firebase configuration
// Replace these values with your actual Firebase configuration
const firebaseConfig = {
    apiKey: "${firebaseApiKey}",
    authDomain: "${firebaseAuthDomain}",
    databaseURL: "${firebaseDatabaseURL}",
    projectId: "${firebaseProjectId}",
    storageBucket: "${firebaseStorageBucket}",
    messagingSenderId: "${firebaseMessagingSenderId}",
    appId: "${firebaseAppId}"
};

// EmailJS configuration
const emailjsConfig = {
    serviceId: "${emailjsServiceId}",
    templateId: "${emailjsTemplateId}",
    publicKey: "${emailjsPublicKey}"
};

// Export configurations
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { firebaseConfig, emailjsConfig };
} else {
    window.firebaseConfig = firebaseConfig;
    window.emailjsConfig = emailjsConfig;
}`;

  fs.writeFileSync('firebase-config.js', configContent);
  
  console.log('\n✅ Configuration saved to firebase-config.js');
  console.log('\n📋 Next Steps:');
  console.log('1. Create technician accounts in Firebase Authentication');
  console.log('2. Set up email templates in EmailJS dashboard');
  console.log('3. Update Firebase security rules (see README.md)');
  console.log('4. Run: npm start');
  console.log('5. Open: http://localhost:3002');
  
  console.log('\n📚 For detailed instructions, see README.md');
  
  rl.close();
}

setup().catch(console.error);

