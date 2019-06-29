//TODO Better handle split cards
const fs = require('fs')
const standardJSON = JSON.parse(fs.readFileSync('data/standard.json'))
const reducedSets = []
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
    reducedForeignData['English'] = card.name
    return {
      translations: reducedForeignData,
      number: card.number
    }
  }).filter((card) => {
    // Filtering mythic edition cards
    return !card.number.includes('★')
  }).filter((card) => {
    // Remove those cards with incomplete translations,
    // M20 only has English translations for now. 
    return Object.keys(card.translations).length >= 9 || setName === 'M20'
  })
  // This set's name in the JSON is not what Arena expects
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
