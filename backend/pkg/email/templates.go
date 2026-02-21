package email

const (
	ticketEmailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <style>
        .container { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { background-color: #4CAF50; color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; line-height: 1.6; }
        .footer { font-size: 0.8em; color: #666; text-align: center; margin-top: 20px; }
        .ticket-code { background-color: #f9f9f9; border: 1px dashed #4CAF50; padding: 10px; font-size: 1.2em; font-weight: bold; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Ticket Confirmed!</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>Your registration for <strong>{{.EventName}}</strong> has been confirmed.</p>
            <div class="ticket-code">{{.TicketCode}}</div>
            <p>Please keep this code handy for entry. You can also download your PDF ticket from your dashboard.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 Event Ticketing System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`

	passwordResetTemplate = `
<!DOCTYPE html>
<html>
<head>
    <style>
        .container { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { background-color: #2196F3; color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; line-height: 1.6; }
        .footer { font-size: 0.8em; color: #666; text-align: center; margin-top: 20px; }
        .button { background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password. Click the button below to proceed:</p>
            <p style="text-align: center;">
                <a href="{{.ResetURL}}" class="button">Reset Password</a>
            </p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>The link will expire in 24 hours.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 Event Ticketing System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`
)
