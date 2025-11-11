// Vercel Serverless Function for Contact Form
// Path: /api/contact.js
// 
// IMPORTANT: Environment variables are set in Vercel Dashboard,
// NOT in this file. Go to: Project Settings → Environment Variables

const nodemailer = require('nodemailer');

// Enable CORS
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  return await fn(req, res);
};

const handler = async (req, res) => {
  console.log('=== Contact Form API Called ===');
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get form data
    const { name, company, email, problem } = req.body;

    console.log('Form submission received:', { name, company, email: email?.substring(0, 20) });

    // Validate required fields
    if (!name || !company || !email || !problem) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { name: !!name, company: !!company, email: !!email, problem: !!problem }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check environment variables exist
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'TIP_TO_EMAIL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars);
      return res.status(500).json({ 
        error: 'Email service not configured',
        missing: missingVars,
        message: 'Environment variables must be set in Vercel Dashboard'
      });
    }

    console.log('✅ All environment variables present');
    console.log('SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      secure: process.env.SMTP_SECURE === 'true'
    });

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
      },
      debug: true,
      logger: true
    });

    // Verify SMTP connection
    console.log('Verifying SMTP connection...');
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified');
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', {
        message: verifyError.message,
        code: verifyError.code,
        response: verifyError.response
      });
      
      return res.status(500).json({ 
        error: 'Email service connection failed',
        details: verifyError.message,
        code: verifyError.code,
        hint: verifyError.code === 'EAUTH' ? 
          'Authentication failed. Check SMTP_USER and SMTP_PASS are correct. Office365 may require an App Password.' : 
          'Check SMTP_HOST and SMTP_PORT are correct.'
      });
    }

    // Prepare email
    const recipientEmail = process.env.TIP_TO_EMAIL;
    const senderEmail = process.env.SMTP_USER;

    console.log('Sending email from:', senderEmail);
    console.log('Sending email to:', recipientEmail);

    const mailOptions = {
      from: `"Website Contact Form" <${senderEmail}>`,
      to: recipientEmail,
      replyTo: email,
      subject: `New Contact: ${company} - ${name}`,
      text: `
New Contact Form Submission

Name: ${name}
Company: ${company}
Email: ${email}
Problem/Question: ${problem}

---
Submitted: ${new Date().toLocaleString()}
From: instantlymarketing.com
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #0B1B34; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 30px; background: #f9f9f9; }
    .field { margin: 20px 0; }
    .label { font-weight: bold; color: #0B1B34; margin-bottom: 5px; }
    .value { padding: 12px; background: white; border-radius: 4px; border-left: 3px solid #F6A701; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .reply-btn { 
      display: inline-block; 
      margin-top: 20px; 
      padding: 12px 24px; 
      background: #F6A701; 
      color: #0B1B34; 
      text-decoration: none; 
      border-radius: 6px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📧 New Contact Form Submission</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Name:</div>
        <div class="value">${name}</div>
      </div>
      <div class="field">
        <div class="label">Company:</div>
        <div class="value">${company}</div>
      </div>
      <div class="field">
        <div class="label">Email:</div>
        <div class="value"><a href="mailto:${email}" style="color: #0B1B34;">${email}</a></div>
      </div>
      <div class="field">
        <div class="label">Problem/Question:</div>
        <div class="value">${problem}</div>
      </div>
      <div style="text-align: center;">
        <a href="mailto:${email}?subject=Re: Your inquiry&body=Hi ${name}," class="reply-btn">
          Reply to ${name}
        </a>
      </div>
    </div>
    <div class="footer">
      <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>From:</strong> instantlymarketing.com</p>
    </div>
  </div>
</body>
</html>
      `
    };

    // Send email
    console.log('Sending email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Accepted:', info.accepted);
    console.log('Rejected:', info.rejected);

    // Return success
    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('❌ Error sending email:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
    
    // Return error
    return res.status(500).json({ 
      error: 'Failed to send email',
      message: error.message,
      code: error.code,
      details: error.response || 'Check Vercel function logs for details'
    });
  }
};

module.exports = allowCors(handler);
