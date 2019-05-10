const fs = require('fs')
const standardJSON = JSON.parse(fs.readFileSync('data/standard.json'))
const reducedSets = []
for (setName of Object.keys(standardJSON)) {
  const setCards = standardJSON[setName].cards
  const setTranslations = standardJSON[setName].translations
  const reducedCards = setCards.map((card)=>{
    const foreignData = card.foreignData.map((card) => { 
      return { name:  card.name, language: card.language}
    })
    const reducedForeignData = {}
    for (translation of foreignData) {
      reducedForeignData[translation.language] = translation.name
    }
    return {
      translations: reducedForeignData,
      name: card.name,
      number: card.number
    }
  })
  const name = setName === "DOM" ? "DAR" : setName
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
fs.writeFileSync('data/reduced.json', JSON.stringify(reducedJSON), 'utf8');
