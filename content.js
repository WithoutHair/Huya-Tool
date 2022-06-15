let streams = {}

let isHostRoom = () => {
  try {
    let room_id = document.getElementsByClassName('host-rid')[0].children[1].textContent
    return room_id
  } catch (error) {
    return false
  }
}

let getHostStat = () => {
  let room_id = isHostRoom()

  http.get('https://www.doseeing.com/huya/data/api/rank', {
    rids: room_id,
    dt: 0,
    rank_type: 'chat_pv'
  }).then(res => {
    res = res.result.result[0]
    let parentNode = document.getElementsByClassName('ht-item')[0],
    statDom = document.createElement('div')
    statDom.className = 'ht-stat'
    parentNode.appendChild(statDom)
  
    statDom.innerHTML = `
      <div class='ht-stat-item'>
        <div class='ht-stat-title'>总收入</div>
        <div class='ht-stat-num'>${res['gift.paid.price'] / 100}元</div>
        <div class='ht-stat-other'>付费人数 ${res['gift.paid.uv']}</div>
      </div>
      <div class='ht-stat-item'>
        <div class='ht-stat-title'>总礼物</div>
        <div class='ht-stat-num'>${res['gift.all.price'] / 100}元</div>
        <div class='ht-stat-other'>送礼人数 ${res['gift.all.uv']}</div>
      </div>
      <div class='ht-stat-item'>
        <div class='ht-stat-title'>总弹幕</div>
        <div class='ht-stat-num'>${res['chat.pv']}条</div>
        <div class='ht-stat-other'>弹幕人数 ${res['chat.uv']}</div>
      </div>
      <div class='ht-stat-item'>
        <div class='ht-stat-title'>开播时长</div>
        <div class='ht-stat-num'>${res['online.minutes']}分</div>
        <div class='ht-stat-other'>活跃人数 ${res['active.uv']}</div>
      </div>
    `
  })
}

let InitInput = () => {
  let inputUrlCon = document.createElement('div')

  inputUrlCon.className = 'ht-input-con'
  inputUrlCon.innerHTML = `
    <div class='ht-input-title'>同屏观看(暂仅支持B站)</div>
    <Input value='https://live.bilibili.com/6' placeholder='eg: https://live.bilibili.com/6' />
    <div class='ht-button-line'>
      <div class='ht-button-ok'>确定</div><div class='ht-button-cancel'>取消</div>
    </div>
  `
  document.body.appendChild(inputUrlCon)

  let hide = () => {
    inputUrlCon.className = inputUrlCon.className.replace('display', '')
  }

  document.getElementsByClassName('ht-button-ok')[0].onclick = async () => {
    hide()
    let urlId = inputUrlCon.children[1].value.split('/').pop()
    let {data} = await getRoomId(urlId)
    let stream = await getStreaming(data.room_id)
    let key = `b-${urlId}`

    streams[key] = {
      quality: stream.data.quality_description
    }

    createVideo(stream.data.durl[0].url, key)
  }

  document.getElementsByClassName('ht-button-cancel')[0].onclick = () => {
    hide()
  }
}

let InitMenu = () => {
  let menuDom = document.createElement('div')

  menuDom.className = 'ht-fixed'
  menuDom.onclick = (e) => {
    if (e.target.className.includes('active')) {
      menuDom.className = 'ht-fixed'
    } else {
      menuDom.className = 'ht-fixed active'
    }
  }
  document.body.appendChild(menuDom)
  menuDom.innerHTML = `
    <div class='ht-con'>
      <div class='ht-item'>
        <img src=${chrome.runtime.getURL('icon/stats.png')} />
      </div>
      <div class='ht-item'>
        <img src=${chrome.runtime.getURL('icon/screen.png')} />
      </div>
    </div>
  `

  document.getElementsByClassName('ht-item')[1].onclick = () => {
    document.getElementsByClassName('ht-input-con')[0].className += ' display'
  }
}

let getRoomId = (id) => {
  return http.get('https://api.live.bilibili.com/room/v1/Room/room_init', {id})
}

let getStreaming = (room_id, qn = 150) => {
  /* 当platform为web流才为flv格式 h5为m3u8
    0: {qn: 10000, desc: '原画'}
    1: {qn: 400, desc: '蓝光'}
    2: {qn: 250, desc: '超清'}
    3: {qn: 150, desc: '高清'}
  */
  return http.get('https://api.live.bilibili.com/room/v1/Room/playUrl', {
    cid: room_id,
    qn,
    platform: 'web',
  })
}

let createVideo = (url, key) => {
  if (flvjs.isSupported()) {
      let video = document.createElement('video'),
        con = document.createElement('div'),
        title = document.createElement('div'),
        select = document.createElement('select'),
        close = document.createElement('img'),
        resizeDot = document.createElement('div'),
        insertButton = document.createElement('div'),
        restoreButton = document.createElement('div'),
        flvPlayer = flvjs.createPlayer({
          type: 'flv',
          url
        })
        flvPlayer.attachMediaElement(video)
        flvPlayer.load()

      video.controls = true
      con.className = `ht-video-con ${key}`
      con.draggable = true
      setDragEvent(con)
      title.className = 'ht-video-title'
      insertButton.className = 'ht-button'
      insertButton.innerHTML = '嵌入直播间'
      insertButton.onclick = () => {
        let now = document.getElementById('hy-video') || document.getElementById('player-recommend')
        video.style.width = '100%'
        now.style.display = 'none'
        document.getElementById('player-video').appendChild(video)
      }
      restoreButton.className = 'ht-button'
      restoreButton.innerHTML = '恢复直播间'
      restoreButton.onclick = () => {
        let now = document.getElementById('hy-video') || document.getElementById('player-recommend')
        now.style.display = 'inline-block'
        con.appendChild(video)
      }
      close.src = chrome.runtime.getURL('icon/close.png')
      close.onclick = function () {
        flvPlayer.destroy()
        this.parentNode.parentNode.remove()
      }
      select.className = 'ht-video-quality'
      select.onchange = e => {
        getStreaming(key.split('-').pop(), e.target.value).then(res => {
          flvPlayer.destroy()
          flvPlayer = flvjs.createPlayer({
            type: 'flv',
            url: res.data.durl[0].url
          })
          flvPlayer.attachMediaElement(video)
          flvPlayer.load()
          flvPlayer.play()
        })
      }
      resizeDot.className = 'ht-video-resize'
      resizeDot.draggable = true

      let qualitys = streams[key]['quality']
      
      qualitys.forEach(q => {
        select.innerHTML += `<option label=${q.desc} value=${q.qn}>`
      })
      select.value = 150

      title.appendChild(select)
      title.appendChild(insertButton)
      title.appendChild(restoreButton)
      title.appendChild(close)
      con.appendChild(title)
      con.appendChild(video)
      con.appendChild(resizeDot)
      document.body.appendChild(con)
      
      flvPlayer.play()
      setResizeEvent(resizeDot)
  }
}

let setDragEvent = (el) => {
  let startX, startY

  el.ondragstart = e => {
    console.log(e)
    startX = e.clientX
    startY = e.clientY
  }
  el.ondragend = e => {
    let top = parseInt(e.target.style.top) || 0,
      left = parseInt(e.target.style.left) || 0

    e.target.style.top = top + e.clientY - startY + 'px'
    e.target.style.left = left + e.clientX - startX + 'px'
  }
}

let setResizeEvent = (el) => {
  let startX, startY
  el.ondragstart = e => {
    e.stopPropagation()
    startX = e.clientX
    startY = e.clientY
  }
  el.ondragend = e => {
    e.stopPropagation()
    let width = e.target.parentNode.clientWidth,
      height = e.target.parentNode.clientHeight

    e.target.parentNode.style.width = width + e.clientX -startX + 'px'
    e.target.parentNode.style.height = height + e.clientY -startY + 'px'
  }
}

let Init = () => {
  if (!isHostRoom()) return
  InitMenu()
  getHostStat()
  InitInput()
}

Init()
