chrome.runtime.onInstalled.addListener(function(details){
  if(details.reason === chrome.runtime.OnInstalledReason.INSTALL){
    initializeDatabase()
  }
});

async function initializeDatabase() {
  const response = await fetch(chrome.extension.getURL('/data/reduced.json'))
  const setJSON = await response.json()
  for (set of setJSON.sets) {
    const cards = {}
    for (card of set.cards) {
      cards[`${card.name}`] = {
        number: card.number,
        translations: card.translations,
        set: set.name
      }
    }
    chrome.storage.local.set(cards)
  }
  chrome.storage.local.set({language: 'English'})
}