// Determine if we are working inside Chrome or Firefox
const platform = chrome || browser

const constants = {
  defaultLanguage: 'English',
  platform
}

module.exports = constants