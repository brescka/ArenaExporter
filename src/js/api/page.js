
// This module is mainly concerned with initializing the extension by appending
// icons to the decklists and creating user facing messages.

import { getFormattedDeck } from './deck.js'

// Master function that handles all of the DOM injection needed for the extension's functionality.
function initializeExtension () {
  // These elements contain both the form that holds the deck data as well as the
  // containers for the icons themselves.
  const deckListIconContainers = document.querySelectorAll('.decklist-icons')
  for (const deckListIconContainer of deckListIconContainers) {
    appendIcon(deckListIconContainer)
  }
  initializeToast()
}

// Loop over the deck elements and append our extension's icon to each one.
function appendIcon (parentElement) {
  const injectedIcon = document.createElement('a')
  injectedIcon.textContent = 'A'
  injectedIcon.classList.add('arena-extension-icon')
  injectedIcon.addEventListener('click', handleIconClick)
  parentElement.append(injectedIcon)
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

async function handleIconClick (event) {
  try {
    const container = event.target.parentElement.parentElement
    const formattedDeck = await getFormattedDeck(container)
    copyToClipboard(formattedDeck)
    displayMessage('Deck copied for Arena import')
  } catch (error) {
    displayMessage(error)
  }
}

// Appends our toast container to the bottom of the page
function initializeToast () {
  const injectedToast = document.createElement('div')
  injectedToast.setAttribute('id', 'arenaExtensionToast')
  injectedToast.textContent = 'Deck copied for Arena import'
  const pageContainer = document.getElementById('page')
  pageContainer.append(injectedToast)
}

export {
  initializeExtension
}