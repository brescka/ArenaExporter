import {initializeExtension} from '../api/page.js'
import '../../css/content.css'
// Injected JS is wrapped in an IIFE to eliminate
// possiblity of contaminating any scope.
(() => {
  // TODO improve module resolution to not use ugly relative positioning
  initializeExtension()
})()
