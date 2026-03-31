import type { GlobalConfig } from 'payload'

const defaultCredentialsTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FAF7F2;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:24px;font-weight:300;color:#1a1a1a;letter-spacing:0.05em;margin:0;">
        Skowronek Studio
      </h1>
    </div>

    <div style="background:#ffffff;padding:40px;border:1px solid #e8e4de;">
      <p style="font-size:16px;color:#1a1a1a;margin:0 0 24px;">
        Cześć {{clientName}},
      </p>
      <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 24px;">
        Twoje zdjęcia{{sessionType}} są gotowe do pobrania!
        Poniżej znajdziesz dane logowania do panelu klienta.
      </p>

      <div style="background:#FAF7F2;padding:24px;margin:0 0 24px;">
        <p style="font-size:13px;color:#826D4C;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px;">
          Dane logowania
        </p>
        <p style="font-size:15px;color:#1a1a1a;margin:0 0 8px;">
          <strong>Email:</strong> {{email}}
        </p>
        <p style="font-size:15px;color:#1a1a1a;margin:0;">
          <strong>Hasło:</strong> {{password}}
        </p>
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="{{siteUrl}}/login" style="display:inline-block;padding:14px 32px;background:#826D4C;color:#ffffff;text-decoration:none;font-size:14px;letter-spacing:0.05em;text-transform:uppercase;">
          Przejdź do panelu
        </a>
      </div>

      <p style="font-size:14px;color:#888;line-height:1.6;margin:0 0 8px;">
        Twoje pliki będą dostępne do <strong>{{expiresAt}}</strong>.
        Po tym terminie konto zostanie automatycznie dezaktywowane.
      </p>
    </div>

    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:13px;color:#aaa;margin:0;">
        Skowronek Studio - Fotografia z pasją
      </p>
    </div>
  </div>
</body>
</html>`

const defaultContactNotificationTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin:0;padding:0;background-color:#FAF7F2;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <h2 style="font-size:20px;font-weight:300;color:#1a1a1a;margin:0 0 24px;">
      Nowa wiadomość z formularza kontaktowego
    </h2>
    <div style="background:#ffffff;padding:24px;border:1px solid #e8e4de;">
      <p style="margin:0 0 8px;"><strong>Imię i nazwisko:</strong> {{name}}</p>
      <p style="margin:0 0 8px;"><strong>Email:</strong> {{email}}</p>
      <p style="margin:0 0 8px;"><strong>Telefon:</strong> {{phone}}</p>
      <p style="margin:0 0 16px;"><strong>Wiadomość:</strong></p>
      <p style="white-space:pre-wrap;color:#555;line-height:1.6;margin:0;">{{message}}</p>
    </div>
  </div>
</body>
</html>`

export const EmailTemplates: GlobalConfig = {
  slug: 'email-templates',
  label: 'Szablony email',
  access: {
    read: ({ req: { user } }) => user?.collection === 'users',
    update: ({ req: { user } }) => user?.collection === 'users',
  },
  fields: [
    {
      name: 'clientCredentials',
      type: 'group',
      label: 'Dane logowania klienta',
      admin: {
        description:
            'Szablon wysyłany do klienta z danymi logowania. Dostępne zmienne: {{clientName}}, {{email}}, {{password}}, {{siteUrl}}, {{expiresAt}}, {{sessionType}}',
      },
      fields: [
        {
          name: 'subject',
          type: 'text',
          label: 'Temat',
          defaultValue: 'Twoje zdjęcia są gotowe - Skowronek Studio',
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'Treść HTML',
          defaultValue: defaultCredentialsTemplate,
          admin: {
            rows: 20,
            description:
                'Pełen szablon HTML emaila. Zmienne: {{clientName}}, {{email}}, {{password}}, {{siteUrl}}, {{expiresAt}}, {{sessionType}}',
          },
        },
      ],
    },
    {
      name: 'contactNotification',
      type: 'group',
      label: 'Powiadomienie o wiadomości kontaktowej',
      admin: {
        description:
            'Szablon wysyłany do studia gdy ktoś wypełni formularz kontaktowy. Zmienne: {{name}}, {{email}}, {{phone}}, {{message}}',
      },
      fields: [
        {
          name: 'subject',
          type: 'text',
          label: 'Temat',
          defaultValue: 'Nowa wiadomość - {{name}}',
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'Treść HTML',
          defaultValue: defaultContactNotificationTemplate,
          admin: {
            rows: 15,
          },
        },
      ],
    },
  ],
}