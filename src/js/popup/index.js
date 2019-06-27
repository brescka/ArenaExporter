import M from 'materialize-css/dist/js/materialize.min.js'
import 'materialize-css/dist/css/materialize.min.css'
import '../../css/popup.css'
document.addEventListener('DOMContentLoaded', function () {
  const select = document.querySelectorAll('select')[0]
  chrome.storage.local.get('language', (data) => {
    const language = Object.keys(data).includes('language') ? data.language : 'English'
    select.value = language
    M.FormSelect.init(select)
    select.addEventListener('change', function () {
      const language = this.value
      chrome.storage.local.set({ language })
    })
  })
})
