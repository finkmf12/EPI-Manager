const { app, BrowserWindow, shell } = require('electron')

const APP_URL = 'https://epi-manager-frontend-academy-cda9.vercel.app'
const APP_ORIGIN = new URL(APP_URL).origin

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    title: 'EPI Manager',
    backgroundColor: '#101d2c',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })

  win.once('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url)
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    try {
      const destination = new URL(url)
      if (destination.origin !== APP_ORIGIN) {
        event.preventDefault()
        if (destination.protocol === 'https:') shell.openExternal(url)
      }
    } catch {
      event.preventDefault()
    }
  })

  win.loadURL(APP_URL)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
