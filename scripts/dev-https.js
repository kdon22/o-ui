const { createServer } = require('https')
const { createServer: createHttpServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Self-signed certificate paths
const certDir = path.join(__dirname, '../certs')
const keyPath = path.join(certDir, 'localhost-key.pem')
const certPath = path.join(certDir, 'localhost.pem')

// Check if certificates exist
function certificatesExist() {
  return fs.existsSync(keyPath) && fs.existsSync(certPath)
}

// Generate self-signed certificates
function generateCertificates() {
  const { execSync } = require('child_process')
  
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true })
  }

  
  
  try {
    // Generate key and certificate
    execSync(`openssl req -x509 -out ${certPath} -keyout ${keyPath} -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -extensions EXT -config <(printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=keyEncipherment,dataEncipherment\nextendedKeyUsage=serverAuth")`, { shell: '/bin/bash' })
    
  } catch (error) {
    console.error('❌ Error generating certificates:', error.message)
    console.log('📋 Please install OpenSSL or run: brew install openssl (macOS)')
    process.exit(1)
  }
}

app.prepare().then(() => {
  // Generate certificates if they don't exist
  if (!certificatesExist()) {
    generateCertificates()
  }

  // HTTPS options
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  }

  // Create HTTPS server
  const server = createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Also create HTTP server that redirects to HTTPS
  const httpServer = createHttpServer((req, res) => {
    res.writeHead(301, {
      Location: `https://${req.headers.host}${req.url}`
    })
    res.end()
  })

  // Start servers
  server.listen(port, (err) => {
    if (err) throw err
    
  })

  httpServer.listen(8080, (err) => {
    if (err) throw err
    
  })
})