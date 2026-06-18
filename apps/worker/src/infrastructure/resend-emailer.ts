export class ResendEmailer {
  constructor(private readonly apiKey: string | undefined, private readonly fromEmail: string | undefined) {}

  async send(to: string, subject: string, html: string): Promise<void> {
    if (this.apiKey === undefined || this.fromEmail === undefined) {
      return;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: this.fromEmail,
        to,
        subject,
        html
      })
    });

    if (!response.ok) {
      throw new Error(`Resend email failed: ${response.status}`);
    }
  }
}
