const express = require('express')
const https = require('https')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const http = require('http')

const DOMAIN = 'ethmap.world'
const PORT = process.env.PORT || 5000
const PROD = process.env.PRODUCTION || false
const HOST = PROD ? `https://${DOMAIN}` : `http://127.0.0.1:${PORT}`


const app = express()
app.use(cors());

const metadataDir = path.join(__dirname, '..', 'data', 'metadata')

// Static public files
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', function(req, res) {
  res.send('Get ready for OpenSea!');
})

app.get('/:token_id', function(req, res) {
  const tokenId = parseInt(req.params.token_id).toString()
  if (tokenId < 1 || tokenId > 178) return res.send({});

  const {
    abbreviation,
    ...metadata
  } = require(path.join(metadataDir, `${tokenId}.json`));
  const data = {
    ...metadata,
    external_url: HOST,
    image: `${HOST}/images/${abbreviation}.svg`
  }
  res.send(data)
})

const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
});

if (PROD) {
  const httpsServer = https.createServer({
    key: fs.readFileSync(`/etc/letsencrypt/live/${DOMAIN}/privkey.pem`),
    cert: fs.readFileSync(`/etc/letsencrypt/live/${DOMAIN}/fullchain.pem`),
  }, app);
  httpsServer.listen(443, () => {
    console.log('HTTPS Server running on port 443');
  });
}