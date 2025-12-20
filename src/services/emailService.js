const nodemailer = require('nodemailer');
const config = require('../config/environment');

class EmailService {
  constructor() {
    this.transporter = null;
    this.setupTransporter();
  }

  setupTransporter() {
    if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT || 587,
        secure: config.SMTP_PORT == 465,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS
        }
      });
      
      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('SMTP connection error:', error.message);
        } else {
          console.log('✓ Email service connected and ready');
        }
      });
    } else {
      console.log('⚠️ Email service not configured - SMTP settings missing');
      console.log('   Required: SMTP_HOST, SMTP_USER, SMTP_PASS in .env file');
    }
  }

  // Check if email service is available
  isAvailable() {
    return this.transporter !== null;
  }

  // Get from address
  getFromAddress() {
    const fromName = config.SMTP_FROM_NAME || 'LaghhuLink';
    const fromEmail = config.SMTP_FROM_EMAIL || config.SMTP_USER;
    return `"${fromName}" <${fromEmail}>`;
  }

  async sendWelcomeEmail(user) {
    if (!this.transporter) {
      console.log('Email service not available');
      return { success: false, error: 'Email service not configured' };
    }

    const mailOptions = {
      from: this.getFromAddress(),
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

  async sendPaymentReminder(user, daysUntilDue, amount) {
    if (!this.transporter) {
      console.log('Email service not available');
      return;
    }

    const mailOptions = {
      from: `"LaghhuLink" <${config.SMTP_USER}>`,
      to: user.email,
      subject: `Payment Reminder - Due in ${daysUntilDue} days`,
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
            .amount { font-size: 24px; font-weight: bold; color: #3B82F6; margin: 20px 0; }
            .button { display: inline-block; background: #3B82F6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Reminder</h1>
            </div>
            <div class="content">
              <h2>Hi ${user.firstName},</h2>
              <p>This is a friendly reminder that your LaghhuLink ${user.plan} plan payment is coming up.</p>
              <div class="amount">Amount Due: $${amount.toFixed(2)}</div>
              <p><strong>Due in ${daysUntilDue} days</strong></p>
              <p>We'll automatically charge your payment method on file. No action needed!</p>
              <a href="https://laghhu.link/billing" class="button">View Billing Details</a>
              <p><small>Having trouble? Contact us at billing@laghhu.link</small></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send payment reminder:', error);
    }
  }

  async sendPaymentFailedNotification(user, amount) {
    if (!this.transporter) {
      console.log('Email service not available');
      return;
    }

    const mailOptions = {
      from: `"LaghhuLink" <${config.SMTP_USER}>`,
      to: user.email,
      subject: 'Action Required - Payment Failed',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #EF4444; color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #EF4444; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Payment Failed</h1>
            </div>
            <div class="content">
              <h2>Hi ${user.firstName},</h2>
              <p>We were unable to process your payment of <strong>$${amount.toFixed(2)}</strong> for your LaghhuLink subscription.</p>
              <p>To continue using your ${user.plan} plan features, please update your payment method.</p>
              <a href="https://laghhu.link/billing" class="button">Update Payment Method</a>
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Your account will remain active for the next 7 days</li>
                <li>After 7 days, your account will be downgraded to the free plan</li>
                <li>Your data will be preserved</li>
              </ul>
              <p><small>Need help? Contact us at billing@laghhu.link</small></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send payment failed notification:', error);
    }
  }

  async sendSubscriptionPausedNotification(user) {
    if (!this.transporter) {
      console.log('Email service not available');
      return;
    }

    const mailOptions = {
      from: `"LaghhuLink" <${config.SMTP_USER}>`,
      to: user.email,
      subject: 'Your Subscription Has Been Paused',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #F59E0B; color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #3B82F6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Subscription Paused</h1>
            </div>
            <div class="content">
              <h2>Hi ${user.firstName},</h2>
              <p>Your LaghhuLink ${user.plan} subscription has been paused.</p>
              <p>While paused:</p>
              <ul>
                <li>You won't be charged</li>
                <li>Your data is safe and preserved</li>
                <li>Existing short links will continue to work</li>
                <li>You can't create new links</li>
              </ul>
              <p>Ready to resume?</p>
              <a href="https://laghhu.link/billing" class="button">Resume Subscription</a>
              <p><small>Questions? Contact us at support@laghhu.link</small></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send subscription paused notification:', error);
    }
  }

  async sendSubscriptionResumedNotification(user) {
    if (!this.transporter) {
      console.log('Email service not available');
      return;
    }

    const mailOptions = {
      from: `"LaghhuLink" <${config.SMTP_USER}>`,
      to: user.email,
      subject: 'Welcome Back! Subscription Resumed',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #3B82F6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome Back!</h1>
            </div>
            <div class="content">
              <h2>Hi ${user.firstName},</h2>
              <p>Great news! Your LaghhuLink ${user.plan} subscription has been resumed.</p>
              <p>You now have full access to all features again:</p>
              <ul>
                <li>Create unlimited short links</li>
                <li>Access advanced analytics</li>
                <li>Use custom domains</li>
                <li>All premium features enabled</li>
              </ul>
              <a href="https://laghhu.link/dashboard" class="button">Go to Dashboard</a>
              <p><small>Questions? Contact us at support@laghhu.link</small></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send subscription resumed notification:', error);
    }
  }

  async sendOverageNotification(user, type, amount, chargeAmount) {
    if (!this.transporter) {
      console.log('Email service not available');
      return;
    }

    const typeDisplay = type === 'urls' ? 'URL creations' : type === 'api_calls' ? 'API calls' : type;

    const mailOptions = {
      from: `"LaghhuLink" <${config.SMTP_USER}>`,
      to: user.email,
      subject: 'Usage Overage Notification',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #F59E0B; color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #3B82F6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 20px 0; }
            .charge { font-size: 20px; font-weight: bold; color: #F59E0B; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Usage Overage Alert</h1>
            </div>
            <div class="content">
              <h2>Hi ${user.firstName},</h2>
              <p>You've exceeded your plan's included ${typeDisplay} limit.</p>
              <p><strong>Overage details:</strong></p>
              <ul>
                <li>Type: ${typeDisplay}</li>
                <li>Amount: ${amount} units</li>
              </ul>
              <div class="charge">Overage charge: $${chargeAmount.toFixed(2)}</div>
              <p>This amount will be added to your next invoice.</p>
              <p><strong>Want to avoid overage charges?</strong> Consider upgrading to a higher plan with more included usage.</p>
              <a href="https://laghhu.link/pricing" class="button">View Plans</a>
              <p><small>Questions? Contact us at billing@laghhu.link</small></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send overage notification:', error);
    }
  }

  async sendTrialEndingNotification(user, daysRemaining) {
    if (!this.transporter) {
      console.log('Email service not available');
      return;
    }

    const mailOptions = {
      from: `"LaghhuLink" <${config.SMTP_USER}>`,
      to: user.email,
      subject: `Your trial ends in ${daysRemaining} days`,
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
            .highlight { background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Trial is Ending Soon</h1>
            </div>
            <div class="content">
              <h2>Hi ${user.firstName},</h2>
              <p>Your ${user.plan} plan trial will end in <strong>${daysRemaining} days</strong>.</p>
              <div class="highlight">
                <p><strong>What happens next?</strong></p>
                <ul>
                  <li>Your trial ends on ${new Date(user.subscription.trialEnd).toLocaleDateString()}</li>
                  <li>We'll charge your payment method on file</li>
                  <li>You'll continue enjoying all ${user.plan} features</li>
                </ul>
              </div>
              <p>No action needed - we'll handle everything automatically!</p>
              <a href="https://laghhu.link/billing" class="button">View Billing Details</a>
              <p>Want to cancel? No problem - you can cancel anytime before your trial ends with no charges.</p>
              <p><small>Questions? Contact us at support@laghhu.link</small></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send trial ending notification:', error);
    }
  }

  // Weekly Performance Digest
  async sendWeeklyDigest(user, stats = null) {
    if (!this.transporter) {
      const error = new Error('Email service not configured. Please add SMTP settings to your .env file.');
      error.code = 'EMAIL_NOT_CONFIGURED';
      throw error;
    }

    // Use provided stats or generate sample data for test
    const weeklyStats = stats || {
      totalClicks: Math.floor(Math.random() * 5000) + 100,
      uniqueVisitors: Math.floor(Math.random() * 3000) + 50,
      newLinks: Math.floor(Math.random() * 20) + 1,
      topLinks: [
        { title: 'Summer Campaign', clicks: 1234, shortCode: 'summer24' },
        { title: 'Product Launch', clicks: 987, shortCode: 'launch' },
        { title: 'Newsletter', clicks: 654, shortCode: 'news' }
      ],
      topCountries: [
        { name: 'Saudi Arabia', percentage: 45 },
        { name: 'UAE', percentage: 25 },
        { name: 'Egypt', percentage: 15 }
      ],
      changeFromLastWeek: Math.floor(Math.random() * 40) - 10
    };

    const changeIcon = weeklyStats.changeFromLastWeek >= 0 ? '📈' : '📉';
    const changeColor = weeklyStats.changeFromLastWeek >= 0 ? '#10B981' : '#EF4444';

    const mailOptions = {
      from: this.getFromAddress(),
      to: user.email,
      subject: `📊 Your Weekly Performance Report - ${weeklyStats.totalClicks.toLocaleString()} clicks!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6, #2563EB); color: white; text-align: center; padding: 40px 30px; border-radius: 12px 12px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px; }
            .stat-grid { display: flex; justify-content: space-around; margin: 25px 0; }
            .stat-box { text-align: center; padding: 15px; background: #F9FAFB; border-radius: 8px; min-width: 100px; }
            .stat-number { font-size: 28px; font-weight: bold; color: #3B82F6; }
            .stat-label { font-size: 12px; color: #6B7280; text-transform: uppercase; }
            .section { margin: 25px 0; padding: 20px; background: #F9FAFB; border-radius: 8px; }
            .section-title { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 15px; }
            .link-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
            .link-row:last-child { border-bottom: none; }
            .button { display: inline-block; background: #3B82F6; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; margin: 20px 0; font-weight: 600; }
            .change { color: ${changeColor}; font-weight: 600; }
            .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0 0 10px 0; font-size: 24px;">Weekly Performance Report</h1>
              <p style="margin: 0; opacity: 0.9;">Week of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>

            <div class="content">
              <h2 style="margin-top: 0;">Hi ${user.firstName}! 👋</h2>
              <p>Here's how your links performed this week:</p>

              <div class="stat-grid">
                <div class="stat-box">
                  <div class="stat-number">${weeklyStats.totalClicks.toLocaleString()}</div>
                  <div class="stat-label">Total Clicks</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${weeklyStats.uniqueVisitors.toLocaleString()}</div>
                  <div class="stat-label">Unique Visitors</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${weeklyStats.newLinks}</div>
                  <div class="stat-label">New Links</div>
                </div>
              </div>

              <p style="text-align: center;">
                ${changeIcon} <span class="change">${weeklyStats.changeFromLastWeek >= 0 ? '+' : ''}${weeklyStats.changeFromLastWeek}%</span> compared to last week
              </p>

              <div class="section">
                <div class="section-title">🏆 Top Performing Links</div>
                ${weeklyStats.topLinks.map((link, i) => `
                  <div class="link-row">
                    <span>${i + 1}. ${link.title || link.shortCode}</span>
                    <span style="color: #3B82F6; font-weight: 600;">${link.clicks.toLocaleString()} clicks</span>
                  </div>
                `).join('')}
              </div>

              <div class="section">
                <div class="section-title">🌍 Top Countries</div>
                ${weeklyStats.topCountries.map(country => `
                  <div class="link-row">
                    <span>${country.name}</span>
                    <span style="color: #6B7280;">${country.percentage}%</span>
                  </div>
                `).join('')}
              </div>

              <div style="text-align: center;">
                <a href="https://laghhu.link/analytics" class="button">View Full Analytics</a>
              </div>

              <div class="footer">
                <p>You're receiving this because you have weekly reports enabled.</p>
                <p><a href="https://laghhu.link/profile" style="color: #3B82F6;">Manage notification preferences</a></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Weekly digest sent to:', user.email);
      return { success: true, message: `Weekly digest sent to ${user.email}` };
    } catch (error) {
      console.error('Failed to send weekly digest:', error);
      throw error;
    }
  }

  // Monthly Business Report
  async sendMonthlyReport(user, stats = null) {
    if (!this.transporter) {
      const error = new Error('Email service not configured. Please add SMTP settings to your .env file.');
      error.code = 'EMAIL_NOT_CONFIGURED';
      throw error;
    }

    const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Use provided stats or generate sample data for test
    const monthlyStats = stats || {
      totalClicks: Math.floor(Math.random() * 20000) + 1000,
      uniqueVisitors: Math.floor(Math.random() * 15000) + 500,
      totalLinks: Math.floor(Math.random() * 100) + 10,
      qrScans: Math.floor(Math.random() * 500) + 50,
      topLinks: [
        { title: 'Black Friday Sale', clicks: 5234, shortCode: 'bf24' },
        { title: 'Product Launch', clicks: 3987, shortCode: 'launch' },
        { title: 'Newsletter Signup', clicks: 2654, shortCode: 'signup' },
        { title: 'Holiday Campaign', clicks: 1876, shortCode: 'holiday' },
        { title: 'Webinar Registration', clicks: 1234, shortCode: 'webinar' }
      ],
      deviceBreakdown: { mobile: 62, desktop: 33, tablet: 5 },
      topCountries: [
        { name: 'Saudi Arabia', clicks: 8500, percentage: 42 },
        { name: 'UAE', clicks: 4200, percentage: 21 },
        { name: 'Egypt', clicks: 3100, percentage: 15 },
        { name: 'Kuwait', clicks: 2200, percentage: 11 },
        { name: 'Other', clicks: 2000, percentage: 11 }
      ],
      changeFromLastMonth: Math.floor(Math.random() * 50) - 15,
      avgClicksPerDay: Math.floor(Math.random() * 500) + 100
    };

    const changeIcon = monthlyStats.changeFromLastMonth >= 0 ? '📈' : '📉';
    const changeColor = monthlyStats.changeFromLastMonth >= 0 ? '#10B981' : '#EF4444';

    const mailOptions = {
      from: this.getFromAddress(),
      to: user.email,
      subject: `📊 Your Monthly Report for ${monthName} - ${monthlyStats.totalClicks.toLocaleString()} clicks!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #7C3AED, #5B21B6); color: white; text-align: center; padding: 40px 30px; border-radius: 12px 12px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px; }
            .stat-grid { display: flex; flex-wrap: wrap; justify-content: space-around; margin: 25px 0; gap: 15px; }
            .stat-box { text-align: center; padding: 20px; background: #F9FAFB; border-radius: 8px; min-width: 120px; flex: 1; }
            .stat-number { font-size: 32px; font-weight: bold; color: #7C3AED; }
            .stat-label { font-size: 12px; color: #6B7280; text-transform: uppercase; margin-top: 5px; }
            .section { margin: 25px 0; padding: 20px; background: #F9FAFB; border-radius: 8px; }
            .section-title { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
            .link-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
            .link-row:last-child { border-bottom: none; }
            .progress-bar { height: 8px; background: #E5E7EB; border-radius: 4px; overflow: hidden; margin-top: 5px; }
            .progress-fill { height: 100%; background: #7C3AED; border-radius: 4px; }
            .button { display: inline-block; background: #7C3AED; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; margin: 20px 0; font-weight: 600; }
            .change { color: ${changeColor}; font-weight: 600; }
            .highlight-box { background: linear-gradient(135deg, #FEF3C7, #FDE68A); padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0 0 10px 0; font-size: 28px;">Monthly Business Report</h1>
              <p style="margin: 0; opacity: 0.9; font-size: 18px;">${monthName}</p>
            </div>

            <div class="content">
              <h2 style="margin-top: 0;">Hi ${user.firstName}! 👋</h2>
              <p>Here's your comprehensive monthly performance summary:</p>

              <div class="stat-grid">
                <div class="stat-box">
                  <div class="stat-number">${monthlyStats.totalClicks.toLocaleString()}</div>
                  <div class="stat-label">Total Clicks</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${monthlyStats.uniqueVisitors.toLocaleString()}</div>
                  <div class="stat-label">Unique Visitors</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${monthlyStats.totalLinks}</div>
                  <div class="stat-label">Active Links</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${monthlyStats.qrScans}</div>
                  <div class="stat-label">QR Scans</div>
                </div>
              </div>

              <div class="highlight-box">
                <p style="margin: 0; text-align: center; font-size: 16px;">
                  ${changeIcon} <span class="change">${monthlyStats.changeFromLastMonth >= 0 ? '+' : ''}${monthlyStats.changeFromLastMonth}%</span> compared to last month
                  <br><span style="color: #6B7280; font-size: 14px;">Average: ${monthlyStats.avgClicksPerDay} clicks/day</span>
                </p>
              </div>

              <div class="section">
                <div class="section-title">🏆 Top 5 Performing Links</div>
                ${monthlyStats.topLinks.map((link, i) => `
                  <div class="link-row">
                    <span><strong>#${i + 1}</strong> ${link.title || link.shortCode}</span>
                    <span style="color: #7C3AED; font-weight: 600;">${link.clicks.toLocaleString()} clicks</span>
                  </div>
                `).join('')}
              </div>

              <div class="section">
                <div class="section-title">📱 Device Breakdown</div>
                <div style="margin-bottom: 15px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span>Mobile</span><span>${monthlyStats.deviceBreakdown.mobile}%</span>
                  </div>
                  <div class="progress-bar"><div class="progress-fill" style="width: ${monthlyStats.deviceBreakdown.mobile}%"></div></div>
                </div>
                <div style="margin-bottom: 15px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span>Desktop</span><span>${monthlyStats.deviceBreakdown.desktop}%</span>
                  </div>
                  <div class="progress-bar"><div class="progress-fill" style="width: ${monthlyStats.deviceBreakdown.desktop}%"></div></div>
                </div>
                <div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Tablet</span><span>${monthlyStats.deviceBreakdown.tablet}%</span>
                  </div>
                  <div class="progress-bar"><div class="progress-fill" style="width: ${monthlyStats.deviceBreakdown.tablet}%"></div></div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">🌍 Geographic Distribution</div>
                ${monthlyStats.topCountries.map(country => `
                  <div class="link-row">
                    <span>${country.name}</span>
                    <span style="color: #6B7280;">${country.clicks.toLocaleString()} clicks (${country.percentage}%)</span>
                  </div>
                `).join('')}
              </div>

              <div style="text-align: center;">
                <a href="https://laghhu.link/analytics" class="button">View Detailed Analytics</a>
              </div>

              <div class="footer">
                <p>You're receiving this because you have monthly reports enabled.</p>
                <p><a href="https://laghhu.link/profile" style="color: #7C3AED;">Manage notification preferences</a></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Monthly report sent to:', user.email);
      return { success: true, message: `Monthly report sent to ${user.email}` };
    } catch (error) {
      console.error('Failed to send monthly report:', error);
      throw error;
    }
  }

  // Viral Link Alert
  async sendViralAlert(user, linkData) {
    if (!this.transporter) {
      const error = new Error('Email service not configured. Please add SMTP settings to your .env file.');
      error.code = 'EMAIL_NOT_CONFIGURED';
      throw error;
    }

    const mailOptions = {
      from: this.getFromAddress(),
      to: user.email,
      subject: `🔥 Your Link is Going Viral! ${linkData.clicks.toLocaleString()} clicks in ${linkData.timeframe}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #EF4444, #DC2626); color: white; text-align: center; padding: 40px 30px; border-radius: 12px 12px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px; }
            .stat-box { text-align: center; padding: 25px; background: #FEF2F2; border-radius: 8px; margin: 20px 0; }
            .stat-number { font-size: 48px; font-weight: bold; color: #EF4444; }
            .button { display: inline-block; background: #EF4444; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">🔥 VIRAL ALERT!</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Your link is on fire!</p>
            </div>

            <div class="content">
              <h2 style="margin-top: 0;">Incredible news, ${user.firstName}! 🎉</h2>
              <p>Your link <strong>"${linkData.linkTitle || linkData.shortUrl}"</strong> is experiencing massive traffic!</p>

              <div class="stat-box">
                <div class="stat-number">${linkData.clicks.toLocaleString()}</div>
                <div style="color: #6B7280; font-size: 14px;">clicks in the last ${linkData.timeframe}</div>
              </div>

              <p><strong>Quick Stats:</strong></p>
              <ul>
                <li>Link: ${linkData.shortUrl}</li>
                <li>Current rate: ~${Math.round(linkData.clicks / (linkData.timeframe === '1 hour' ? 1 : 24))} clicks/hour</li>
                <li>Top source: ${linkData.topSource || 'Direct traffic'}</li>
              </ul>

              <div style="text-align: center;">
                <a href="https://laghhu.link/analytics/${linkData.linkId || ''}" class="button">View Live Analytics</a>
              </div>

              <p style="color: #6B7280; font-size: 14px;">
                💡 <strong>Tip:</strong> Make sure your destination page can handle the traffic surge!
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Viral alert sent to:', user.email);
      return { success: true, message: `Viral alert sent to ${user.email}` };
    } catch (error) {
      console.error('Failed to send viral alert:', error);
      throw error;
    }
  }

  // Test notification for preferences page
  async sendTestNotification(user, type) {
    // Check if email service is configured first
    if (!this.transporter) {
      const error = new Error('Email service not configured. Please add SMTP_HOST, SMTP_USER, and SMTP_PASS to your .env file.');
      error.code = 'EMAIL_NOT_CONFIGURED';
      throw error;
    }

    switch (type) {
      case 'weekly':
        return this.sendWeeklyDigest(user);
      case 'monthly':
        return this.sendMonthlyReport(user);
      case 'viral':
        return this.sendViralAlert(user, {
          linkTitle: 'Test Link',
          shortUrl: 'https://laghhu.link/test',
          clicks: 1500,
          timeframe: '1 hour',
          topSource: 'Twitter'
        });
      default:
        throw new Error('Unknown notification type');
    }
  }
}

module.exports = new EmailService();