export const metadata = {
  title: 'Checklist Manet',
  description: 'Checklist de abertura da pizzaria',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body style={{margin:0,padding:0,background:'#faf9f6',minHeight:'100vh'}}>
        {children}
      </body>
    </html>
  )
}