export function authErrorMessage(error:{status?:number;code?:string;message?:string}){
 const message=error.message||''
 if(error.code==='otp_expired'||/token.*expired|invalid.*otp/i.test(message))return 'That code is invalid or expired. Check the newest email or request a fresh code.'
 if(error.code==='email_not_confirmed')return 'Your email is not confirmed yet. Use the signup verification screen to enter or resend your email code.'
 if(error.status===429||error.code==='over_email_send_rate_limit'||/rate.limit/i.test(message))return 'The email sender has reached its limit. Your signup cannot send another confirmation right now. Existing confirmed accounts can still log in.'
 if(error.code==='email_address_not_authorized'||/email.*not.*authorized/i.test(message))return 'The verification-email sender cannot deliver to this address yet. PAU biziz support needs to connect an email sender.'
 if(error.code==='unexpected_failure'||/sending.*email|smtp|mail.*provider/i.test(message))return 'We could not complete signup right now. Your details have been kept. Please contact PAU biziz support if this continues.'
 if(error.code==='invalid_credentials')return 'The email or password is incorrect. Use the password for your existing account.'
 if(/fetch|network/i.test(message))return 'Could not reach the sign-in service. Check your connection and try again.'
 return message||'Unable to sign in. Please try again.'
}
