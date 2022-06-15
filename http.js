let http = {
    get (url, params, options = {}) {
      let flag = false
      for (let k in params) {
        let str = `${flag ? '&' : '?'}${k}=${params[k]}`
        flag = true
        url = url + str
      }
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'http',
          url,
          options
        }, res => {
          resolve(res)
        })
      })
    }
}