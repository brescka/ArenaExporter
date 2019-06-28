import {defaultLanguage, platform} from '../api/constants.js'

platform.runtime.onInstalled.addListener(function () {
  initializeDatabase()
})

async function initializeDatabase () {
  const response = await fetch(platform.extension.getURL('/data/reduced.json'))
  const setJSON = await response.json()
  for (const set of setJSON.sets) {
    const cards = {}
    for (const card of set.cards) {
      cards[`${card.translations[defaultLanguage]}`] = {
        number: card.number,
        translations: card.translations,
        set: set.name
      }
    }
    platform.storage.local.set(cards)
  }
  platform.storage.local.set({ language: defaultLanguage })
}
