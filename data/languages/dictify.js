const iso639 = require('./iso-639-1.json')
const ietf = require('./ietf-language-tags.json')
const ietfToISO = ietf.reduce((obj, lang) => ({
  ...obj,
  [lang.lang]: iso639.find(l => l.alpha2 == lang.langType)
}), {})

const path = require('path')
require('fs').writeFileSync(
  path.join(__dirname, 'ietf-to-iso-639-1.json'),
  JSON.stringify(ietfToISO, null, 2)
)