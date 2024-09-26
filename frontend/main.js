const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const http = require('http');

let mainWindow;
let flaskProcess;

function createWindow() {
  console.log("Creando ventana principal...");
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL('http://localhost:65535');
  console.log("Cargando URL http://localhost:65535...");

  mainWindow.on('closed', () => {
    if (flaskProcess) {
      console.log("Cerrando proceso Flask...");
      flaskProcess.kill();
    }
    mainWindow = null;
    console.log("Ventana principal cerrada.");
  });
}


function startFlask() {
  console.log("Iniciando el servidor Flask...");
  flaskProcess = exec('python app.py', { cwd: path.join(__dirname, '../backend') }, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error al iniciar Flask: ${err.message}`);
      console.error(stderr);
      return;
    }
    console.log(`Flask iniciado: ${stdout}`);
  });

  flaskProcess.on('error', (err) => {
    console.error(`Error en el proceso de Flask: ${err.message}`);
  });

  flaskProcess.on('exit', (code, signal) => {
    console.log(`El proceso de Flask se cerro con el codigo: ${code} y la senal: ${signal}`);
  });
}


function checkServer(retries = 20, delay = 5000) {
  const options = {
    host: 'localhost',
    port: 65535,
    timeout: 1000,
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log("Servidor Flask esta disponible.");
        resolve();
      } else {
        reject(new Error(`Status Code: ${res.statusCode}`));
      }
    });

    req.on('error', (error) => {
      console.error(`Error en la solicitud HTTP: ${error.message}`);
      if (retries === 0) {
        console.log("No quedan reintentos.");
        reject(new Error('El servidor Flask no esta disponible.'));
      } else {
        setTimeout(() => {
          console.log(`Reintentando. Intentos restantes: ${retries}`);
          checkServer(retries - 1, delay).then(resolve).catch(reject);
        }, delay);
      }
    });

    req.end();
  });
}

app.whenReady().then(() => {
  startFlask();
  setTimeout(() => {
    checkServer().then(() => {
      createWindow();
    }).catch((err) => {
      console.error('No se pudo conectar al servidor Flask:', err.message);
      app.quit();
    });
  }, 5000); // Espera 5 segundos antes de comenzar a verificar

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Maneja la solicitud del frontend para seleccionar un directorio
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (!result.canceled) {
    return result.filePaths[0];
  }
});
