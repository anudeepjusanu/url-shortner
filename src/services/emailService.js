const nodemailer = require('nodemailer');
const config = require('../config/environment');

class EmailService {
  constructor() {
    this.transporter = null;
    this.setupTransporter();
  }

  setupTransporter() {
    if (config.SMTP_HOST) {
      this.transporter = nodemailer.createTransporter({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT == 465,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS
        }
      });
    } else {
      console.log('Email service not configured - SMTP settings missing');
    }
  }

  async sendWelcomeEmail(user) {
    if (!this.transporter) {
      console.log('Email service not available');
      return;
    }

    const mailOptions = {
      from: `"LaghhuLink" <${config.SMTP_USER}>`,
      to: user.email,
      subject: 'Welcome to LaghhuLink! 🚀',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3B82F6; color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #3B82F6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 20px 0; }
            .features { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .feature { margin: 10px 0; }
            .feature-icon { color: #10B981; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to LaghhuLink!</h1>
              <p>Your professional URL shortener is ready</p>
            </div>

            <div class="content">
              <h2>Hi ${user.firstName}!</h2>

              <p>Thank you for joining LaghhuLink! We're excited to help you create powerful short links with advanced analytics.</p>

              <div class="features">
                <h3>🎉 Your Free Account Includes:</h3>
                <div class="feature">✅ <strong>100 URLs per month</strong></div>
                <div class="feature">✅ <strong>Basic analytics</strong></div>
                <div class="feature">✅ <strong>Standard support</strong></div>
                <div class="feature">✅ <strong>Reliable laghhu.link domain</strong></div>
              </div>

              <p>Ready to create your first short link?</p>

              <a href="https://laghhu.link/dashboard" class="button">Start Creating Links</a>

              <p><strong>Need custom domains or unlimited links?</strong><br>
              Upgrade to Pro for just $9/month and unlock advanced features like custom domains, unlimited URLs, and priority support.</p>

              <a href="https://laghhu.link/pricing" class="button" style="background: #10B981;">View Pro Features</a>

              <hr>

              <p><small>
                Questions? Reply to this email or contact us at support@laghhu.link<br>
                Follow us: <a href="#">Twitter</a> | <a href="#">LinkedIn</a>
              </small></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent to:', user.email);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  }

  async sendAdminNotification(user) {
    if (!this.transporter) return;

    const mailOptions = {
      from: `"LaghhuLink System" <${config.SMTP_USER}>`,
      to: 'info@syberviz.com',
      subject: '🎉 New User Registration - LaghhuLink',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1F2937; color: white; text-align: center; padding: 20px; border-radius: 8px; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 10px; }
            .user-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📊 New User Registration</h2>
            </div>

            <div class="content">
              <h3>A new user has registered on LaghhuLink!</h3>

              <div class="user-info">
                <strong>User Details:</strong><br>
                👤 <strong>Name:</strong> ${user.firstName} ${user.lastName}<br>
                📧 <strong>Email:</strong> ${user.email}<br>
                📅 <strong>Registered:</strong> ${new Date().toLocaleString()}<br>
                🎯 <strong>Plan:</strong> ${user.plan || 'Free'}<br>
                🆔 <strong>User ID:</strong> ${user._id}
              </div>

              <p><a href="https://laghhu.link/admin/users/${user._id}">View User Profile</a></p>

              <hr>
              <p><small>This is an automated notification from LaghhuLink system.</small></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Admin notification sent for new user:', user.email);
    } catch (error) {
      console.error('Failed to send admin notification:', error);
    }
  }

  async sendUsageLimitWarning(user, usagePercentage) {
    if (!this.transporter) return;

    const mailOptions = {
      from: `"LaghhuLink" <${config.SMTP_USER}>`,
      to: user.email,
      subject: `⚠️ You've used ${usagePercentage}% of your monthly URL limit`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 20px; border-radius: 8px; }
            .button { display: inline-block; background: #3B82F6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="warning">
              <h2>⚠️ Usage Limit Warning</h2>
              <p>Hi ${user.firstName},</p>
              <p>You've used <strong>${usagePercentage}%</strong> of your monthly URL creation limit.</p>
              <p>Current usage: <strong>${user.usage.urlsCreatedThisMonth}/100 URLs</strong></p>

              ${usagePercentage >= 90 ?
                '<p><strong style="color: #DC2626;">You\'re running low on URLs!</strong> Consider upgrading to Pro for unlimited URLs.</p>' :
                '<p>No action needed yet, but consider upgrading if you need more URLs.</p>'
              }

              <a href="https://laghhu.link/pricing" class="button">Upgrade to Pro</a>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send usage warning:', error);
    }
  }

  async sendUpgradeConfirmation(user, plan) {
    if (!this.transporter) return;

    const mailOptions = {
      from: `"LaghhuLink" <${config.SMTP_USER}>`,
      to: user.email,
      subject: `🎉 Welcome to LaghhuLink ${plan.charAt(0).toUpperCase() + plan.slice(1)}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; text-align: center; padding: 30px; border-radius: 8px; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 8px; margin-top: 10px; }
            .features { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Upgrade Successful!</h1>
              <p>Welcome to LaghhuLink ${plan.charAt(0).toUpperCase() + plan.slice(1)}</p>
            </div>

            <div class="content">
              <h2>Hi ${user.firstName}!</h2>
              <p>Your account has been successfully upgraded to LaghhuLink ${plan.charAt(0).toUpperCase() + plan.slice(1)}!</p>

              <div class="features">
                <h3>🚀 Your new features include:</h3>
                ${plan === 'pro' ? `
                  <div>✅ <strong>Unlimited URLs</strong></div>
                  <div>✅ <strong>Custom domains</strong></div>
                  <div>✅ <strong>Advanced analytics</strong></div>
                  <div>✅ <strong>Priority support</strong></div>
                  <div>✅ <strong>Bulk operations</strong></div>
                  <div>✅ <strong>Password protection</strong></div>
                ` : `
                  <div>✅ <strong>Everything in Pro</strong></div>
                  <div>✅ <strong>Team collaboration</strong></div>
                  <div>✅ <strong>API access</strong></div>
                  <div>✅ <strong>White-label solution</strong></div>
                  <div>✅ <strong>Dedicated support</strong></div>
                `}
              </div>

              <p>Start using your new features right away!</p>
              <a href="https://laghhu.link/dashboard" style="display: inline-block; background: #3B82F6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px;">Go to Dashboard</a>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send upgrade confirmation:', error);
    }
  }
}

module.exports = new EmailService();