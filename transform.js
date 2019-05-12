const fs = require('fs')
const standardJSON = JSON.parse(fs.readFileSync('data/standard.json'))
const reducedSets = []
// For some reason MTGJSON does not have translations for some of the basic
// land printings, so here we catalogue them for later double checks.
const basicLands = ['Island', 'Plains', 'Swamp', 'Mountain', 'Forest']
for (const setName of Object.keys(standardJSON)) {
  const setCards = standardJSON[setName].cards
  const setTranslations = standardJSON[setName].translations
  const reducedCards = setCards.map((card) => {
    const foreignData = card.foreignData.map((card) => {
      return { name: card.name, language: card.language }
    })
    const reducedForeignData = {}
    for (const translation of foreignData) {
      reducedForeignData[translation.language] = translation.name
    }
    return {
      translations: reducedForeignData,
      name: card.name,
      number: card.number
    }
  }).filter((card) => {
    // Filtering mythic edition cards
    return !card.number.includes('★')
  }).filter((card) => {
    // Remove those cards with no translations
    return Object.keys(card.translations).length > 0
  })
  const name = setName === 'DOM' ? 'DAR' : setName
  const reducedSet = {
    name,
    cards: reducedCards,
    translations: setTranslations
  }
  reducedSets.push(reducedSet)
}
const reducedJSON = {
  sets: reducedSets
}
fs.writeFileSync('data/reduced.json', JSON.stringify(reducedJSON), 'utf8')
