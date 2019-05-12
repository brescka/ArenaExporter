document.addEventListener('DOMContentLoaded', function() {
  const select = document.querySelectorAll('select')[0];
  M.FormSelect.init(select);
  chrome.storage.local.get('language', (data)=>{
    const language = Object.keys(data).includes('language') ? data.language : 'English'
    select.value = language
    select.addEventListener('change', function(){
      const language = this.value
      chrome.storage.local.set({ language })
    });
  })
});