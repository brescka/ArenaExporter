chrome.runtime.onInstalled.addListener(function () {
  initializeDatabase()
})

async function initializeDatabase () {
  const response = await fetch(chrome.extension.getURL('/data/reduced.json'))
  const setJSON = await response.json()
  for (const set of setJSON.sets) {
    const cards = {}
    for (const card of set.cards) {
      cards[`${card.translations['English']}`] = {
        number: card.number,
        translations: card.translations,
        set: set.name
      }
    }
    chrome.storage.local.set(cards)
  }
  chrome.storage.local.set({ language: 'English' })
}
