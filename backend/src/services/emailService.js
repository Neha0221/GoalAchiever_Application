const nodemailer = require('nodemailer');

// Email configuration
const createTransporter = () => {
  // For development, use Ethereal Email for testing
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'ethereal.pass'
      }
    });
  }

  // For production, use your email service provider
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Email templates
const templates = {
  emailVerification: (data) => ({
    subject: 'Verify Your Email Address',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Goal Achiever!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.firstName}!</h2>
            <p>Thank you for registering with Goal Achiever. To complete your registration, please verify your email address by clicking the button below:</p>
            <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${data.verificationUrl}">${data.verificationUrl}</a></p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account with us, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Goal Achiever. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${data.firstName}!
      
      Thank you for registering with Goal Achiever. To complete your registration, please verify your email address by visiting this link:
      
      ${data.verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account with us, please ignore this email.
      
      Best regards,
      The Goal Achiever Team
    `
  }),

  passwordReset: (data) => ({
    subject: 'Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #f44336; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.firstName}!</h2>
            <p>We received a request to reset your password for your Goal Achiever account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${data.resetUrl}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${data.resetUrl}">${data.resetUrl}</a></p>
            <div class="warning">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© 2024 Goal Achiever. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${data.firstName}!
      
      We received a request to reset your password for your Goal Achiever account.
      
      To reset your password, visit this link:
      ${data.resetUrl}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
      
      Best regards,
      The Goal Achiever Team
    `
  }),

  welcome: (data) => ({
    subject: 'Welcome to Goal Achiever!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Goal Achiever</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Goal Achiever!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.firstName}!</h2>
            <p>Congratulations! Your email has been verified and your account is now active.</p>
            <p>You can now start setting and achieving your goals with our powerful goal-tracking platform.</p>
            <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
            <p>Here's what you can do next:</p>
            <ul>
              <li>Set your first goal</li>
              <li>Create a personalized action plan</li>
              <li>Track your progress daily</li>
              <li>Get AI-powered insights and recommendations</li>
            </ul>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>© 2024 Goal Achiever. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${data.firstName}!
      
      Congratulations! Your email has been verified and your account is now active.
      
      You can now start setting and achieving your goals with our powerful goal-tracking platform.
      
      Visit your dashboard: ${data.dashboardUrl}
      
      Here's what you can do next:
      - Set your first goal
      - Create a personalized action plan
      - Track your progress daily
      - Get AI-powered insights and recommendations
      
      If you have any questions, feel free to reach out to our support team.
      
      Best regards,
      The Goal Achiever Team
    `
  })
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template name
 * @param {Object} options.data - Template data
 * @param {string} options.html - Custom HTML content
 * @param {string} options.text - Custom text content
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    let emailContent;
    
    if (options.template && templates[options.template]) {
      emailContent = templates[options.template](options.data);
    } else {
      emailContent = {
        subject: options.subject,
        html: options.html,
        text: options.text
      };
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@goalachiever.com',
      to: options.to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const result = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(result));
      console.log('📱 Open the preview URL in your browser to see the email');
    }

    return result;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Send verification email
 * @param {string} email - Recipient email
 * @param {string} firstName - User's first name
 * @param {string} verificationUrl - Verification URL
 */
const sendVerificationEmail = async (email, firstName, verificationUrl) => {
  return sendEmail({
    to: email,
    template: 'emailVerification',
    data: { firstName, verificationUrl }
  });
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} firstName - User's first name
 * @param {string} resetUrl - Reset URL
 */
const sendPasswordResetEmail = async (email, firstName, resetUrl) => {
  return sendEmail({
    to: email,
    template: 'passwordReset',
    data: { firstName, resetUrl }
  });
};

/**
 * Send welcome email
 * @param {string} email - Recipient email
 * @param {string} firstName - User's first name
 * @param {string} dashboardUrl - Dashboard URL
 */
const sendWelcomeEmail = async (email, firstName, dashboardUrl) => {
  return sendEmail({
    to: email,
    template: 'welcome',
    data: { firstName, dashboardUrl }
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};