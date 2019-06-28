import M from 'materialize-css/dist/js/materialize.min.js'
import 'materialize-css/dist/css/materialize.min.css'
import '../../css/popup.css'
import {getLanguage} from '../api/database'
document.addEventListener('DOMContentLoaded', async function () {
  const select = document.querySelectorAll('select')[0]
  const language = await getLanguage()
  select.value = language
  M.FormSelect.init(select)
  select.addEventListener('change', function () {
    const language = this.value
    chrome.storage.local.set({ language })
  })
})
