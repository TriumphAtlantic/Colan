<?php
// Contact Form Handler for Cecola Development
// Simple PHP mail() function for GoDaddy hosting
// Place this file in the same directory as your HTML file

// Prevent direct access
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.html');
    exit;
}

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
$to_email = "eric.quidort@byersindustrial.com"; // Your email
$from_email = "website@cecoladevelopment.com"; // Sender email
$from_name = "Cecola Development Website"; // Sender name

// ============================================
// GET AND VALIDATE FORM DATA
// ============================================
$name = htmlspecialchars(trim($_POST['name'] ?? ''));
$company = htmlspecialchars(trim($_POST['company'] ?? ''));
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$problem = htmlspecialchars(trim($_POST['problem'] ?? ''));

// Validate required fields
if (empty($name) || empty($company) || empty($email) || empty($problem)) {
    header('Location: index.html?error=missing_fields');
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: index.html?error=invalid_email');
    exit;
}

// ============================================
// PREPARE EMAIL CONTENT
// ============================================
$subject = "New Contact Form Submission - Cecola Development";

// Create email body
$email_body = "
New Contact Form Submission from Cecola Development Website

Name: $name
Company: $company
Email: $email
Problem/Question: $problem

---
Submitted: " . date('Y-m-d H:i:s') . "
IP Address: " . $_SERVER['REMOTE_ADDR'] . "
From: cecoladevelopment.com
";

// Create email headers
$headers = "From: $from_name <$from_email>\r\n";
$headers .= "Reply-To: $email\r\n"; // When you hit reply, it goes to the form submitter
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// ============================================
// SEND EMAIL
// ============================================
$mail_sent = @mail($to_email, $subject, $email_body, $headers);

// ============================================
// LOG SUBMISSION (for your records)
// ============================================
$log_file = 'form_submissions.log';
$log_entry = date('Y-m-d H:i:s') . " | Name: $name | Company: $company | Email: $email | Status: ";

if ($mail_sent) {
    // Success
    $log_entry .= "SUCCESS\n";
    file_put_contents($log_file, $log_entry, FILE_APPEND);
    
    // Redirect to thank you page
    header('Location: thank-you.html');
    exit;
} else {
    // Error
    $log_entry .= "FAILED\n";
    file_put_contents($log_file, $log_entry, FILE_APPEND);
    
    // Redirect back with error
    header('Location: index.html?error=send_failed');
    exit;
}
?>
