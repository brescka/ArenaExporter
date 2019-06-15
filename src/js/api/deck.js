import {getLanguage, getCard} from './database.js'

// getMainDeck and getSideboard traverse the DOM for deck information, then transform
// them into arrays. It is very brittle as it depends on the host page not chaging DOM
// structure. The API for getting decks by name does seem to be open (and powers their own
// deck download button), but I'd prefer not hitting their API without permission.
async function getMainDeck (deckContainer) {
  const mainDeck = []
  const deckSections = deckContainer.getElementsByClassName('sorted-by-overview-container')[0].children
  for (let section of deckSections) {
    const cards = await getDeckSection(section)
    mainDeck.push(cards)
  }
  return mainDeck.flat()
}

async function getSideboard (deckContainer) {
  const deckSideboard = deckContainer.getElementsByClassName('sorted-by-sideboard-container')[0]
  return getDeckSection(deckSideboard)
}

async function getDeckSection (container) {
  return new Promise(async (resolve, reject) => {
    const cards = container.getElementsByClassName('row')
    const section = []
    for (let card of cards) {
      try {
        const count = card.getElementsByClassName('card-count')[0].textContent
        const name = card.getElementsByClassName('card-name')[0].textContent
        const cardData = await getCard(name)
        cardData.count = count
        section.push(cardData)
      } catch (error) {
        reject(error)
      }
    }
    resolve(section)
  })
}

// The only exported function from this module,
// it's job is to provide a deck given a container
// supplied by an icon's click event.
async function getFormattedDeck(container) {
  return new Promise(async (resolve, reject) => {
    try {
      const language = await getLanguage()
      const mainDeck = await getMainDeck(container)
      const sideboard = await getSideboard(container)
      const formattedDeck = formatDeck(mainDeck, sideboard, language)
      resolve(formattedDeck)
    } catch(error) {
      reject(error)
    }
  })
}

// Helper function that accepts arrays of cards and joins them in a way that
// Arena can properly parse.
function formatDeck (mainDeck, sideBoard, language) {
  const formattedMainDeck = mainDeck.map((cardData) => {
    return formatCard(cardData, language)
  }).join('\n') + '\n\n'
  const formattedSideBoard = sideBoard.map((cardData) => {
    return formatCard(cardData, language)
  }).join('\n')
  return formattedMainDeck.concat(formattedSideBoard)
}

// Formats a singular card by transforming its format
// in the database to a string consumable by Arena
function formatCard(cardData, language) {
  const {count, set, number} = cardData
  const name = cardData.names[language]
  return `${count} ${name} (${set}) ${number}`
}

export default {
  getFormattedDeck
}