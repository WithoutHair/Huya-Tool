chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request, sender, sendResponse)
  switch (request.type) {
    case 'http':
      fetch(request.url, request.options)
        .then(response => response.json())
        .then(data => sendResponse(data))
      return true
  
    default:
      sendResponse('default')
      break;
  }
})