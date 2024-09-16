const { ipcRenderer } = require('electron');

// Abre la carpeta seleccionada
document.getElementById('open-folder-btn').addEventListener('click', () => {
    ipcRenderer.send('open-folder-dialog');
});

// Función para crear un nodo en el árbol de archivos
function createTreeNode(item) {
    const li = document.createElement('li');
    li.textContent = item.name;
    li.classList.add(item.type);

    if (item.type === 'directory') {
        li.classList.add('directory');
        li.style.cursor = 'pointer';

        // Agregar un manejador de clics para expandir/colapsar el directorio
        li.addEventListener('click', () => {
            const children = li.querySelector('ul');
            if (children) {
                children.classList.toggle('hidden');
            } else {
                ipcRenderer.send('open-folder-dialog', { path: item.path });
            }
        });

        const ul = document.createElement('ul');
        ul.classList.add('hidden'); // Ocultar subdirectorios por defecto
        li.appendChild(ul);
    } else {
        li.classList.add('file');
        li.style.cursor = 'pointer';

        // Agregar un manejador de clics para abrir archivos
        li.addEventListener('click', () => {
            ipcRenderer.send('open-file', item.path);
        });
    }

    return li;
}

// Maneja la selección de la carpeta y muestra los archivos
ipcRenderer.on('selected-directory', (event, data) => {
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = '';

    data.items.forEach(item => {
        const treeNode = createTreeNode(item);
        fileList.appendChild(treeNode);
    });
});

// Muestra el contenido del archivo en el editor
ipcRenderer.on('file-opened', (event, content) => {
    document.getElementById('code-editor').value = content;
});

// Manejador para guardar el contenido del editor
document.getElementById('send-btn').addEventListener('click', async () => {
    const message = document.getElementById('chat-input').value;
    const chatLog = document.getElementById('chat-log');

    if (message.trim()) {
        chatLog.innerHTML += `<p><strong>You:</strong> ${message}</p>`;
        document.getElementById('chat-input').value = '';

        try {
            const response = await fetch('/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: message }),
            });

            const data = await response.json();

            if (data.response) {
                chatLog.innerHTML += `<p><strong>GPT:</strong> ${data.response}</p>`;
            } else if (data.error) {
                chatLog.innerHTML += `<p><strong>Error:</strong> ${data.error}</p>`;
            }
        } catch (error) {
            chatLog.innerHTML += `<p><strong>Error:</strong> No se pudo conectar con el servidor.</p>`;
        }
    }
});

// Atajo de teclado para guardar
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        const content = document.getElementById('code-editor').value;
        ipcRenderer.send('save-file', { content, filePath: 'path-to-save-file' });
    }
});
