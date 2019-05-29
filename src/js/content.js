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
  // TODO: Refactor this whole section
  async function getCardDetails (cardContainer, language) {
    return new Promise(async (resolve) => {
      const count = cardContainer.getElementsByClassName('card-count')[0].textContent
      let name = cardContainer.getElementsByClassName('card-name')[0].textContent
      const lookupKey = name.split('//')[0].trim()
      // Not happy with the pattern here, but object desconstruction is acting wonky when waiting
      // on async functions. I'm not sure if it's intended or not so more research is required.
      let data
      try {
        data = await queryDatabase(lookupKey, language)
        if (language !== 'English') {
          name = data.name
        }
      } catch (error) {
        const closestMatch = await findClosestMatch(lookupKey)
        // We reset name because the original name is what gave us
        // the error in the first place
        data = await queryDatabase(closestMatch, language)
        name = data.name
      }
      resolve(`${count} ${name} (${data.set}) ${data.number}`)
    })
  }

  // Helper function that handles querrying for card data and returning
  // a string containing the card's data in a digestable format.
  async function queryDatabase (key, language) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(key, function (data) {
        if (Object.keys(data).includes(key)) {
          let name = key
          const set = data[key].set
          const number = data[key].number.replace(/\D/g, '')
          if (language !== 'English') {
            name = data[key].translations[language]
          }
          resolve({ name, set, number })
        } else {
          reject(new Error(`Could not find card data for ${key}`))
        }
      })
    })
  }

  // This function is called in times where the decklist contains
  // anomalies in its name and we cannot find an exact match. It leverages
  // levenshtein distance to determine the closest match.
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
  // then removes it after a set time. Can be improved by debouncing the hiding
  // function, ensuring multiple fast clicks dont trigger weird animation glitches
  function revealToast (length) {
    const toast = document.getElementById('arenaExtensionToast')
    toast.classList.add('show')
    setTimeout(() => toast.classList.remove('show'), length)
  }

  // Slightly restructured version of levenshtein distance calculation
  // made by gustf (https://github.com/gustf/js-levenshtein).
  // All credit to that repo and usage here licensed under MIT (https://opensource.org/licenses/MIT)
  function levenshtein (a, b) {
    if (a === b) {
      return 0
    }

    if (a.length > b.length) {
      let tmp = a
      a = b
      b = tmp
    }

    let la = a.length
    let lb = b.length

    while (la > 0 && (a.charCodeAt(la - 1) === b.charCodeAt(lb - 1))) {
      la--
      lb--
    }

    let offset = 0

    while (offset < la && (a.charCodeAt(offset) === b.charCodeAt(offset))) {
      offset++
    }

    la -= offset
    lb -= offset

    if (la === 0 || lb < 3) {
      return lb
    }

    let x = 0
    let y
    let d0
    let d1
    let d2
    let d3
    let dd
    let dy
    let ay
    let bx0
    let bx1
    let bx2
    let bx3

    let vector = []

    for (y = 0; y < la; y++) {
      vector.push(y + 1)
      vector.push(a.charCodeAt(offset + y))
    }

    let len = vector.length - 1

    for (; x < lb - 3;) {
      bx0 = b.charCodeAt(offset + (d0 = x))
      bx1 = b.charCodeAt(offset + (d1 = x + 1))
      bx2 = b.charCodeAt(offset + (d2 = x + 2))
      bx3 = b.charCodeAt(offset + (d3 = x + 3))
      dd = (x += 4)
      for (y = 0; y < len; y += 2) {
        dy = vector[y]
        ay = vector[y + 1]
        d0 = levenshteinMin(dy, d0, d1, bx0, ay)
        d1 = levenshteinMin(d0, d1, d2, bx1, ay)
        d2 = levenshteinMin(d1, d2, d3, bx2, ay)
        dd = levenshteinMin(d2, d3, dd, bx3, ay)
        vector[y] = dd
        d3 = d2
        d2 = d1
        d1 = d0
        d0 = dy
      }
    }

    for (; x < lb;) {
      bx0 = b.charCodeAt(offset + (d0 = x))
      dd = ++x
      for (y = 0; y < len; y += 2) {
        dy = vector[y]
        vector[y] = dd = levenshteinMin(dy, d0, dd, bx0, vector[y + 1])
        d0 = dy
      }
    }

    return dd
  }

  function levenshteinMin (d0, d1, d2, bx, ay) {
    return d0 < d1 || d2 < d1 ? d0 > d2 ? d2 + 1 : d0 + 1 : bx === ay ? d1 : d1 + 1
  }
})()
