const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const http = require('http');
const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Crea la ventana de Electron
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, // Necesario para usar Node.js en el frontend
      contextIsolation: false,
    },
  });

  win.loadURL('http://localhost:5000');
}

// Inicia el servidor Flask
function startFlask() {
  exec('python ../backend/app.py', { cwd: path.join(__dirname, '../backend') }, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error al iniciar Flask: ${err.message}`);
      return;
    }
    console.log(`Flask iniciado: ${stdout}`);
  });
}

// Verifica si Flask está disponible en localhost:5000
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
                    console.log('Reintentando conectar al servidor Flask...');
                    checkServer(retries - 1).then(resolve).catch(reject);
                }, 1000);
            }
        });

        req.end();
    });
}

// Función para leer un directorio y devolver archivos y subdirectorios
async function readDirectory(dirPath) {
    const items = await readdir(dirPath);
    const results = [];

    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
            results.push({ name: item, type: 'directory', path: fullPath });
        } else {
            results.push({ name: item, type: 'file', path: fullPath });
        }
    }

    return results;
}

// Manejador de evento para abrir el diálogo de selección de carpetas
ipcMain.on('open-folder-dialog', async (event, { path: folderPath } = {}) => {
    if (!folderPath) {
        // Si no se especifica una ruta, abre el diálogo de selección de carpeta
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });

        if (!result.canceled) {
            folderPath = result.filePaths[0];
        } else {
            return;
        }
    }

    // Lee el directorio y envía los datos al renderizador
    const items = await readDirectory(folderPath);
    event.sender.send('selected-directory', { path: folderPath, items });
});

// Manejador para abrir un archivo
ipcMain.on('open-file', async (event, filePath) => {
    try {
        const content = await readFile(filePath, 'utf8');
        event.sender.send('file-opened', content);
    } catch (err) {
        event.sender.send('error', 'No se pudo abrir el archivo.');
    }
});

// Manejador para guardar un archivo
ipcMain.on('save-file', async (event, { content, filePath }) => {
    try {
        await writeFile(filePath, content, 'utf8');
    } catch (err) {
        event.sender.send('error', 'No se pudo guardar el archivo.');
    }
});

app.whenReady().then(() => {
  startFlask();

  // Verifica que el servidor Flask esté corriendo antes de crear la ventana
  checkServer().then(() => {
    createWindow();
  }).catch((err) => {
    console.error('No se pudo conectar al servidor Flask:', err.message);
    app.quit();
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
