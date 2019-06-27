import levenshtein from 'js-levenshtein'
// This module is the home to all calls to the database,
// which holds both card data and language settings.

// Base function for all calls to chrome local storage.
// Returns data associated with a given key or throws
// an error if there is none.
async function queryDatabase(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, function (data) {
      if (Object.keys(data).includes(key)) {
        resolve(data[key])
      } else {
        reject(new Error(`Could not find entry for ${key}`))
      }
    })
  })
}

// Retrieve the currently selected language. If the key is missing for some
// unknown reason, default to English.
async function getLanguage () {
  try {
    const language = await queryDatabase('language')
    return language
  }
  catch {
    return 'English'
  }
}

// Base function for getting the name, set, and ID of a card
// Automatically handles unknown cards by searching for nearest card name
async function getCard(cardName) {
  try {
    const rawData = await queryDatabase(cardName)
    const cardData = transformCardData(rawData)
    return cardData
  } catch {
    const closestCard = findClosestMatch(cardName)
    const rawData = await queryDatabase(closestCard)
    const cardData = transformCardData(rawData)
    return cardData
  }
}

// Finds the closest matching title to a given card name
// as calculated by levenshtein distance.
async function findClosestMatch (cardName) {
  return new Promise((resolve) => {
    // I don't want an arary of thousands of items just taking up memory for fringe cases,
    // so this list of all card titles is created on demand and released shortly thereafter.
    chrome.storage.local.get(null, function (items) {
      const allTitles = Object.keys(items)
      const closestMatch = allTitles.reduce((a, b) => {
        const aDistance = levenshtein(cardName, a)
        const bDistance = levenshtein(cardName, b)
        return aDistance <= bDistance ? a : b
      })
      resolve(closestMatch)
    })
  })
}

// Helper function for transforming data as stored in local storage
// to supply a card's name set, and number
function transformCardData(data) {
  const names = data.names
  const set = data.set
  // Remove any non-numeric characters in the card number
  const number = data.number.replace(/\D/g, '')
  return { names, set, number}
}

export {
  getLanguage,
  getCard
}