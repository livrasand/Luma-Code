const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const http = require('http');

let flaskProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL('http://localhost:5000');

  win.on('closed', () => {
    if (flaskProcess) {
      flaskProcess.kill('SIGINT');
    }
  });
}

function startFlask() {
  flaskProcess = exec('python ../backend/app.py', { cwd: path.join(__dirname, '../backend') }, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error al iniciar Flask: ${err.message}`);
      return;
    }
    console.log(`Flask iniciado: ${stdout}`);
  });

  flaskProcess.on('error', (err) => {
    console.error(`Error en el proceso de Flask: ${err.message}`);
  });
}

function checkServer(retries = 10) {
  const options = {
    host: 'localhost',
    port: 5000,
    timeout: 1000,
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve();
      } else {
        reject();
      }
    });

    req.on('error', () => {
      if (retries === 0) {
        reject(new Error('El servidor Flask no está disponible.'));
      } else {
        setTimeout(() => {
          checkServer(retries - 1).then(resolve).catch(reject);
        }, 1000);
      }
    });

    req.end();
  });
}

app.whenReady().then(() => {
  startFlask();

  checkServer().then(() => {
    createWindow();

     ipcMain.handle('select-directory', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        return result.filePaths[0];
    });
  }).catch((err) => {
    console.error('No se pudo conectar al servidor Flask:', err.message);
    app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
