// @ts-nocheck
import { MailService } from '@sendgrid/mail';

// Initialize the mail service only if API key is available
let mailService: MailService | null = null;

if (process.env.SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid mail service initialized');
} else {
  console.log('SendGrid API key not found, email functionality will be limited');
}

export interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string | undefined;
  html?: string | undefined;
}

/**
 * Send an email using SendGrid
 * @param params Email parameters
 * @returns Promise resolving to boolean indicating success
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!mailService) {
      console.log('SendGrid mail service not initialized, email not sent');
      console.log('Email would have been sent to:', params.to);
      console.log('Email subject:', params.subject);
      return false;
    }

    // Ensure text or html is provided (SendGrid requires at least one)
    const emailData: {
      to: string;
      from: string;
      subject: string;
      text?: string;
      html?: string;
    } = {
      to: params.to,
      from: params.from,
      subject: params.subject,
    };

    if (params.text) emailData.text = params.text;
    if (params.html) emailData.html = params.html;
    
    // If neither text nor html is provided, add a default text
    if (!params.text && !params.html) {
      emailData.text = "This is an email from Sonata Financial Application.";
    }

    await mailService.send(emailData);
    
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}