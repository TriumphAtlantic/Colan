// Updated Contact Form Handler for Vercel API
// Replace the existing handleFormSubmit function in your index.html with this:

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('.submit-btn');
  const originalText = submitBtn.textContent;
  
  // Show loading state
  submitBtn.textContent = 'Sending...';
  submitBtn.disabled = true;
  
  // Get form data
  const formData = {
    name: document.getElementById('name').value,
    company: document.getElementById('company').value,
    email: document.getElementById('email').value,
    problem: document.getElementById('problem').value
  };
  
  try {
    // Send to Vercel API endpoint
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      // Success - redirect to thank you page
      window.location.href = '/thank-you.html';
    } else {
      // Error from API
      alert('Oops! Something went wrong. Please try again or call us at 609-318-3470.');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  } catch (error) {
    // Network error
    console.error('Error:', error);
    alert('Oops! Something went wrong. Please try again or call us at 609-318-3470.');
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// Make sure your form HTML looks like this:
// <form onsubmit="handleFormSubmit(event)">
//   ... form fields ...
// </form>
