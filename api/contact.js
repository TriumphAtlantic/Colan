// Vercel Serverless Function for Contact Form
// Path: /api/contact.js

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
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get form data
    const { name, company, email, problem } = req.body;

    // Validate required fields
    if (!name || !company || !email || !problem) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Create email transporter using environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true', // false for 587, true for 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        minVersion: 'TLSv1.2'
      }
    });

    // Verify connection
    try {
      await transporter.verify();
      console.log('SMTP connection verified');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      return res.status(500).json({ 
        error: 'Email service configuration error',
        details: process.env.NODE_ENV === 'development' ? verifyError.message : undefined
      });
    }

    // Email content
    const mailOptions = {
      from: `"Cecola Development Website" <${process.env.SMTP_USER}>`, // Must match SMTP_USER domain
      to: process.env.TIP_TO_EMAIL || process.env.SMTP_USER, // Where to send the email
      replyTo: email, // When you reply, it goes to the form submitter
      subject: 'New Contact Form Submission - Cecola Development',
      text: `
New Contact Form Submission from Cecola Development Website

Name: ${name}
Company: ${company}
Email: ${email}
Problem/Question: ${problem}

---
Submitted: ${new Date().toLocaleString()}
From: cecoladevelopment.com
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0B1B34; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .field { margin: 15px 0; }
    .label { font-weight: bold; color: #0B1B34; }
    .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Contact Form Submission</h2>
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
        <div class="value"><a href="mailto:${email}">${email}</a></div>
      </div>
      <div class="field">
        <div class="label">Problem/Question:</div>
        <div class="value">${problem}</div>
      </div>
    </div>
    <div class="footer">
      <p>Submitted: ${new Date().toLocaleString()}</p>
      <p>From: cecoladevelopment.com</p>
    </div>
  </div>
</body>
</html>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);

    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = allowCors(handler);
```

### **Step 3: Verify Your Vercel Environment Variables**

Make sure you have ALL of these set in Vercel (Project Settings → Environment Variables):
```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=sales@constructionmarket.org
SMTP_PASS=Byers4040!
TIP_TO_EMAIL=sales@constructionmarket.org
TIP_FROM_EMAIL=sales@constructionmarket.org
