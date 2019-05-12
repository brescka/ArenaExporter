// Injected JS is wrapped in an IIFE to eliminate
// possiblity of contaminating any scope.
(() => {
  appendExtension()

  // Master function that handles all of the DOM injection needed for the extension's functionality.
  function appendExtension () {
    // These elements contain both the form that holds the deck data as well as the
    // containers for the icons themselves.
    const deckListIconContainers = document.querySelectorAll('.decklist-icons')
    for (const deckListIconContainer of deckListIconContainers) {
      appendIcon(deckListIconContainer)
    }
    appendToast()
  }

  // Loop over the deck elements and append our extension's icon to each one.
  function appendIcon (parentElement) {
    const injectedIcon = document.createElement('a')
    injectedIcon.textContent = 'A'
    injectedIcon.classList.add('arena-extension-icon')
    injectedIcon.addEventListener('click', handleIconClick)
    parentElement.append(injectedIcon)
  }

  // Appends our toast container to the bottom of the page
  function appendToast () {
    const injectedToast = document.createElement('div')
    injectedToast.setAttribute('id', 'arenaExtensionToast')
    injectedToast.textContent = 'Deck copied for Arena import'
    const pageContainer = document.getElementById('page')
    pageContainer.append(injectedToast)
  }

  // Function that handles clicks firing on the extension's icon.
  // Leverages other functions to retrieve and format deck data,
  // then copies the value to the user's clipboard.
  async function handleIconClick (event) {
    try {
      const container = event.target.parentElement.parentElement
      const language = await getLanguage()
      const mainDeck = await getMainDeck(container, language)
      const sideBoard = await getSideboard(container, language)
      const formattedDeck = formatDeck(mainDeck, sideBoard)
      copyToClipboard(formattedDeck)
      displayMessage('Deck copied for Arena import')
    } catch (error) {
      displayMessage(error)
    }
  }

  // Retrieve the currently selected language. If the key is missing for some
  // unknown reason, default to English.
  async function getLanguage () {
    return new Promise((resolve) => {
      chrome.storage.local.get('language', function (data) {
        resolve(Object.keys(data).includes('language') ? data.language : 'English')
      })
    })
  }

  // getMainDeck and getSideboard traverse the DOM for deck information, then transform
  // them into arrays. It is very brittle as it depends on the host page not chaging DOM
  // structure. The API for getting decks by name does seem to be open (and powers their own
  // deck download button), but I'd prefer not hitting their API without permission.
  async function getMainDeck (deckContainer, language) {
    const mainDeck = []
    const deckSections = deckContainer.getElementsByClassName('sorted-by-overview-container')[0].children
    for (let section of deckSections) {
      const cards = await getDeckSection(section, language)
      mainDeck.push(cards)
    }
    return mainDeck.flat()
  }

  async function getSideboard (deckContainer, language) {
    const deckSideboard = deckContainer.getElementsByClassName('sorted-by-sideboard-container')[0]
    return getDeckSection(deckSideboard, language)
  }

  async function getDeckSection (container, language) {
    const cards = container.getElementsByClassName('row')
    return new Promise(async (resolve, reject) => {
      const section = []
      for (let card of cards) {
        try {
          const cardData = await getCardDetails(card, language)
          section.push(cardData)
        } catch (error) {
          reject(error)
        }
      }
      resolve(section)
    })
  }

  // Helper function that traverses a given DOM element for its children that contain
  // the data we need for a particular card - it's name and quantity. Then uses
  // name to query local storage for set and id.
  async function getCardDetails (cardContainer, language) {
    const count = cardContainer.getElementsByClassName('card-count')[0].textContent
    let name = cardContainer.getElementsByClassName('card-name')[0].textContent
    return new Promise((resolve, reject) => {
      const lookupKey = name.split('//')[0].trim()
      chrome.storage.local.get(lookupKey, function (data) {
        if (Object.keys(data).includes(lookupKey)) {
          console.log(data)
          const set = data[lookupKey].set
          const number = data[lookupKey].number.replace(/\D/g, '')
          if (language !== 'English') {
            name = data[lookupKey].translations[language]
          }
          resolve(`${count} ${name} (${set}) ${number}`)
        } else {
          reject(new Error(`Could not find card data for ${name}`))
        }
      })
    })
  }

  // Helper function that accepts arrays of cards and joins them in a way that
  // arena can properly parse.
  function formatDeck (mainDeck, sideBoard) {
    const formattedMainDeck = mainDeck.join('\n') + '\n\n'
    const formattedSideBoard = sideBoard.join('\n')
    return formattedMainDeck.concat(formattedSideBoard)
  }

  // Very standard function for creating a placeholder element to hold our data
  // then committing it to the clipboard via execCommand.
  function copyToClipboard (deckString) {
    const placeholder = document.createElement('textarea')
    placeholder.value = deckString
    document.body.appendChild(placeholder)
    placeholder.select()
    document.execCommand('copy')
    document.body.removeChild(placeholder)
  }

  // Helper function that displays success and error messages to the user.
  function displayMessage (message, length = 3000) {
    const toast = document.getElementById('arenaExtensionToast')
    toast.textContent = message
    revealToast(length)
  }

  // Helper function that adds the class that allows the toast to be visible,
  // then removes it after a set time
  function revealToast (length) {
    const toast = document.getElementById('arenaExtensionToast')
    toast.classList.add('show')
    setTimeout(() => toast.classList.remove('show'), length)
  }
})()
