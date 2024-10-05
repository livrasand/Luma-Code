let fileNameModified = 'untitled';

function fetchDirectory(path, parentElement) {
        fetch('/list-directory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ directory: path })
        })
            .then(response => response.json())
            .then(data => {
                if (data.items) {
                    data.items.forEach(item => {
                        const li = document.createElement('li');
                        li.dataset.path = item.path;
                        li.classList.add('directory-item');

                        // Añadir ícono SVG
                        const icon = document.createElement('span');
                        if (item.is_dir) {
                            // SVG para carpeta cerrada
                            icon.innerHTML = `
                        <svg aria-hidden="true" focusable="false" class="octicon octicon-file-directory-fill" viewBox="0 0 16 16" width="16" height="16" fill="#54aeff" style="display: inline-block; user-select: none; vertical-align: text-bottom; overflow: visible;"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"></path></svg>`;
                        } else {
                            // SVG para archivo
                            icon.innerHTML = `
                        <svg aria-hidden="true" focusable="false" class="octicon octicon-file" viewBox="0 0 16 16" width="16" height="16" fill="#59636e" style="display: inline-block; user-select: none; vertical-align: text-bottom; overflow: visible;"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path></svg>`;
                        }
                        li.appendChild(icon);
                        li.appendChild(document.createTextNode(item.name));

                        li.addEventListener('contextmenu', (e) => {
                            e.preventDefault();
                            showContextMenu(e, item.path, item.name);
                        });

                        if (item.is_dir) {
                            li.classList.add('folder');
                            li.addEventListener('click', (e) => {
                                e.stopPropagation();
                                toggleDirectory(item.path, li);

                                // Cambia el SVG al abrir o cerrar la carpeta
                                const isOpened = li.classList.toggle('opened'); // Agrega o quita la clase 'opened'
                                icon.innerHTML = isOpened
                                    ? `
                            <svg aria-hidden="true" focusable="false" class="octicon octicon-file-directory-open-fill" viewBox="0 0 16 16" width="16" height="16" fill="#54aeff" style="display: inline-block; user-select: none; vertical-align: text-bottom; overflow: visible;"><path d="M.513 1.513A1.75 1.75 0 0 1 1.75 1h3.5c.55 0 1.07.26 1.4.7l.9 1.2a.25.25 0 0 0 .2.1H13a1 1 0 0 1 1 1v.5H2.75a.75.75 0 0 0 0 1.5h11.978a1 1 0 0 1 .994 1.117L15 13.25A1.75 1.75 0 0 1 13.25 15H1.75A1.75 1.75 0 0 1 0 13.25V2.75c0-.464.184-.91.513-1.237Z"></path></svg>`
                                    : `
                            <svg aria-hidden="true" focusable="false" class="octicon octicon-file-directory-fill" viewBox="0 0 16 16" width="16" height="16" fill="#54aeff" style="display: inline-block; user-select: none; vertical-align: text-bottom; overflow: visible;"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"></path></svg>`; // Vuelve al SVG de la carpeta cerrada
                            });
                        } else {
                            li.addEventListener('click', (e) => {
                                e.stopPropagation(); // No es necesario en este caso
                                loadFile(item.path);
                            });
                        }
                        parentElement.appendChild(li);
                    });
                } else if (data.error) {
                    const errorItem = document.createElement('li');
                    errorItem.textContent = `Error: ${data.error}`;
                    parentElement.appendChild(errorItem);
                }
            })
            .catch(error => {
                console.error('Error al cargar el directorio:', error);
            });
    }

    function toggleDirectory(path, liElement) {
        const isOpen = liElement.classList.contains('open');
        if (isOpen) {
            const subUl = liElement.querySelector('ul');
            if (subUl) {
                subUl.remove(); // Cerrar el directorio
            }
            liElement.classList.remove('open');
        } else {
            const subUl = document.createElement('ul');
            subUl.classList.add('sub-directory');
            liElement.appendChild(subUl);
            liElement.classList.add('open');
            fetchDirectory(path, subUl); // Abrir el directorio
        }
    }


    // Función para cargar el contenido de un archivo en el editor
    function loadFile(path) {
        fetch('/read-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        })
            .then(response => response.json())
            .then(data => {
                if (data.content) {
                    // Establecer el contenido del archivo
                    editor.setValue(data.content);

                    // Obtener el nombre del archivo sin la extensión
                    const fileName = path.split('\\').pop();
                    isModified = false; // Establecer como no modificado
                    updateFileName(); // Actualizar el nombre en la barra de estado
                    fileNameModified = fileName

                    // Obtener el lenguaje de programación basado en la extensión del archivo
                    const language = getFileLanguage(path);

                    // Establecer el lenguaje en el modelo del editor
                    monaco.editor.setModelLanguage(editor.getModel(), language);

                    // Guardar la ruta del archivo actual
                    currentFilePath = path;

                    // Calcular la cantidad de líneas
                    const lineCount = data.content.split('\n').length;

                    // Calcular el tamaño del archivo en bytes
                    const fileSize = new Blob([data.content]).size; // Tamaño en bytes
                    const sizeInKB = (fileSize / 1024).toFixed(2); // Tamaño en KB
                    const sizeInMB = (fileSize / (1024 * 1024)).toFixed(2); // Tamaño en MB

                    // Actualizar la barra de estado con la información del archivo
                    const statusFileTitle = document.getElementById('status-file-title');
                    const statusCursorPosition = document.getElementById('status-cursor-position');
                    const statusFileLanguage = document.getElementById('status-file-language');

                    statusFileTitle.textContent = fileName; // Mostrar el nombre del archivo
                    statusCursorPosition.textContent = `1:1`; // Inicializar la posición del cursor
                    statusFileLanguage.textContent = language; // Mostrar el lenguaje del archivo

                    // Mostrar la cantidad de líneas y el tamaño del archivo
                    const fileInfo = document.createElement('span');
                    fileInfo.id = 'status-file-info'; // Asignar un ID si quieres modificarlo más tarde
                    fileInfo.textContent = `${lineCount} lines · ${fileSize < 2048 ? sizeInKB + ' KB' : sizeInMB + ' MB'}`;

                    // Limpiar el contenido anterior y agregar la nueva información
                    const existingInfo = document.getElementById('status-file-info');
                    if (existingInfo) {
                        existingInfo.textContent = fileInfo.textContent;
                    } else {
                        document.getElementById('status-bar').appendChild(fileInfo); // Suponiendo que tienes un contenedor para la barra de estado
                    }
                } else if (data.error) {
                    console.error('Error al cargar el archivo:', data.error);
                }
            })
            .catch(error => {
                console.error('Error al leer el archivo:', error);
            });
    }

document.addEventListener('DOMContentLoaded', () => {
    const { ipcRenderer } = window;


    document.getElementById('chat-input').addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            if (!e.shiftKey) {
                e.preventDefault(); // Evitar el salto de línea
                await sendMessage(); // Enviar el mensaje
            }
        }
    });

    function scrollToBottom() {
        const chatLog = document.getElementById('chat-log');
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    async function sendMessage() {
        const message = document.getElementById('chat-input').value;
        const chatLog = document.getElementById('chat-log');
        startPomodoro();

        if (message.trim()) {
            chatLog.innerHTML += `<p><strong class="user-message">You:</strong> ${escapeHTML(message)}</p>`;
            document.getElementById('chat-input').value = ''; // Limpiar el input

            scrollToBottom(); // Hacer scroll hacia abajo

            try {
                const response = await fetch('/ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: message }),
                });

                const data = await response.json();

                // Verificar si hay un mensaje de alerta
                if (data.alert) {
                    showAlert(data.alert);

                    // Usamos setTimeout para permitir que el resto del código se ejecute después de mostrar la alerta
                    setTimeout(() => {
                        // Continúa con el resto del código
                        if (data.response) {
                            let formattedResponse = escapeHTML(data.response);
                            formattedResponse = formatResponse(formattedResponse);
                            chatLog.innerHTML += `<p><strong class="gpt-message">Luma:</strong> ${formattedResponse}</p>`;
                            Prism.highlightAll(); // Aplicar resaltado de sintaxis
                        } else if (data.error) {
                            chatLog.innerHTML += `<p><strong>Error:</strong> ${data.error}</p>`;
                        }
                    }, 0);  // Esto permite que se ejecute inmediatamente después de que el hilo de ejecución termine
                } else if (data.response) {
                    let formattedResponse = escapeHTML(data.response);
                    formattedResponse = formatResponse(formattedResponse);
                    chatLog.innerHTML += `<p><strong class="gpt-message">Luma:</strong> ${formattedResponse}</p>`;
                    Prism.highlightAll(); // Aplicar resaltado de sintaxis
                } else if (data.error) {
                    chatLog.innerHTML += `<p><strong>Error:</strong> ${data.error}</p>`;
                }
            } catch (error) {
                chatLog.innerHTML += `<p><strong>Error:</strong> No se pudo conectar con el servidor.</p>`;
            }
        }
    }


    function formatResponse(response) {
        // Formatear bloques de código, encabezados y enlaces como antes
        response = response.replace(/```([a-zA-Z]*)([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || 'plaintext';
            const escapedCode = escapeHTML(code);
            return `<div class="code-block"><pre><code class="language-${escapeHTML(language)}">${escapedCode}</code></pre><button class="copy-btn">Copy</button><button class="run-btn">Run</button></div>`;
        });

        response = response.replace(/`([^`]+)`/g, (match, code) => {
            return `<code class="inline-code">${escapeHTML(code)}</code>`;
        });

        response = response.replace(/(^|\n)#### (.*?)(\n|$)/g, '<h4>$2</h4>');
        response = response.replace(/(^|\n)### (.*?)(\n|$)/g, '<h3>$2</h3>');
        response = response.replace(/(^|\n)## (.*?)(\n|$)/g, '<h2>$2</h2>');
        response = response.replace(/(^|\n)# (.*?)(\n|$)/g, '<h1>$2</h1>');
        response = response.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        return response;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, (tag) => {
            const charsToReplace = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            };
            return charsToReplace[tag] || tag;
        });
    }
});

let currentDirectoryPath = '';

let currentFilePath = '';

document.addEventListener('DOMContentLoaded', () => {
    const { ipcRenderer } = window;
    let directoryStack = [];

    document.getElementById('open-folder-btn').addEventListener('click', () => {
        ipcRenderer.invoke('select-directory')
            .then(directoryPath => {
                if (directoryPath) {
                    currentDirectoryPath = directoryPath;
                    fetchDirectory(directoryPath, document.getElementById('file-list'));
                }
            })
            .catch(error => {
                console.error('Error al seleccionar el directorio:', error);
            });
        startPomodoro();
    });

    // Asegúrate de que esto esté después de que el editor haya sido creado
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();  // Evitar que se ejecute la acción predeterminada del navegador
            saveFile();          // Llama a tu función para guardar
        }
    });

    // Definición de la función saveFile
    function saveFile() {
        const fileContent = editor.getValue(); // Obtener el contenido del editor

        if (currentFilePath) {
            fetch('/save-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: currentFilePath, content: fileContent })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        isModified = false;  // Archivo guardado correctamente, no modificado
                        updateFileName();
                    } else {
                        alert('Error al guardar el archivo: ' + data.error);
                    }
                })
                .catch(error => {
                    alert('Error al realizar la solicitud: ' + error);
                });
        } else {
            alert('No hay archivo cargado para guardar.');
        }
    }
    // El fetchDirectory iba aquí
    


    // Evento para crear un Snapshot
    document.getElementById('backup-directory-button').addEventListener('click', function () {
        const button = this;

        if (!currentDirectoryPath) {
            alert("No se ha abierto ningún directorio.");
            return;
        }

        // Deshabilitar el botón al iniciar el proceso
        button.disabled = true;
        button.textContent = "Creating a snapshot..."; // Cambiar el texto del botón opcionalmente

        fetch('/create-snapshot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ directory: currentDirectoryPath }) // Usar la ruta almacenada
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Snapshot creado exitosamente");
                    // Aquí puedes actualizar la lista de snapshots si lo deseas.
                } else {
                    alert("Error al crear snapshot: " + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("Ocurrió un error durante la creación del snapshot.");
            })
            .finally(() => {
                // Habilitar el botón de nuevo después de que el proceso finalice (éxito o error)
                button.disabled = false;
                button.textContent = "Create Snapshot"; // Restaurar el texto del botón
            });
    });


    // Función para determinar el lenguaje del archivo basado en la extensión
    function getFileLanguage(path) {
        if (path.endsWith('.js')) return 'javascript';
        if (path.endsWith('.py')) return 'python';
        if (path.endsWith('.html')) return 'html';
        if (path.endsWith('.css')) return 'css';
        if (path.endsWith('.json')) return 'json';
        if (path.endsWith('.md')) return 'markdown';
        if (path.endsWith('.xml')) return 'xml';
        if (path.endsWith('.cpp')) return 'cpp';
        if (path.endsWith('.java')) return 'java';
        if (path.endsWith('.php')) return 'php';
        if (path.endsWith('.rb')) return 'ruby';
        if (path.endsWith('.go')) return 'go';
        if (path.endsWith('.rs')) return 'rust';
        if (path.endsWith('.ts')) return 'typescript';
        if (path.endsWith('.swift')) return 'swift';
        if (path.endsWith('.kt')) return 'kotlin';
        if (path.endsWith('.scala')) return 'scala';
        if (path.endsWith('.sql')) return 'sql';
        if (path.endsWith('.sh')) return 'bash';
        if (path.endsWith('.bat')) return 'batch';
        if (path.endsWith('.pl')) return 'perl';
        if (path.endsWith('.hs')) return 'haskell';
        if (path.endsWith('.lua')) return 'lua';
        if (path.endsWith('.r')) return 'r';
        if (path.endsWith('.m')) return 'matlab';
        if (path.endsWith('.tex')) return 'latex';
        if (path.endsWith('.vb')) return 'vbscript';
        if (path.endsWith('.ps1')) return 'powershell';
        if (path.endsWith('.f90')) return 'fortran';
        if (path.endsWith('.vhd')) return 'vhdl';
        if (path.endsWith('.coffee')) return 'coffeescript';
        if (path.endsWith('.erl')) return 'erlang';
        if (path.endsWith('.fs')) return 'fsharp';
        if (path.endsWith('.clj')) return 'clojure';
        if (path.endsWith('.groovy')) return 'groovy';
        if (path.endsWith('.dart')) return 'dart';
        // Extensiones adicionales para HTML
        if (path.endsWith('.htm')) return 'html';
        if (path.endsWith('.xhtml')) return 'html';

        // Extensiones adicionales para JavaScript
        if (path.endsWith('.mjs')) return 'javascript';
        if (path.endsWith('.cjs')) return 'javascript';

        // Extensiones adicionales para Python
        if (path.endsWith('.pyw')) return 'python';

        // Extensiones adicionales para PHP
        if (path.endsWith('.phtml')) return 'php';
        if (path.endsWith('.php3')) return 'php';
        if (path.endsWith('.php4')) return 'php';
        if (path.endsWith('.php5')) return 'php';

        // Extensiones adicionales para C++
        if (path.endsWith('.cxx')) return 'cpp';
        if (path.endsWith('.cc')) return 'cpp';
        if (path.endsWith('.h')) return 'cpp';
        if (path.endsWith('.hpp')) return 'cpp';

        // Extensiones adicionales para Java
        if (path.endsWith('.jsp')) return 'java';
        if (path.endsWith('.jav')) return 'java';

        // Extensiones adicionales para Markdown
        if (path.endsWith('.markdown')) return 'markdown';

        // Crystal
        if (path.endsWith('.cr')) return 'crystal';

        // Nim
        if (path.endsWith('.nim')) return 'nim';
        if (path.endsWith('.nims')) return 'nim';

        // Julia
        if (path.endsWith('.jl')) return 'julia';

        // OCaml
        if (path.endsWith('.ml')) return 'ocaml';
        if (path.endsWith('.mli')) return 'ocaml';

        // Zig
        if (path.endsWith('.zig')) return 'zig';

        // D
        if (path.endsWith('.d')) return 'dlang';

        // Scheme
        if (path.endsWith('.scm')) return 'scheme';
        if (path.endsWith('.ss')) return 'scheme';

        // Forth
        if (path.endsWith('.fs')) return 'forth';

        // Ada
        if (path.endsWith('.adb')) return 'ada';
        if (path.endsWith('.ads')) return 'ada';

        // Prolog
        if (path.endsWith('.pl')) return 'prolog';

        // Verilog
        if (path.endsWith('.v')) return 'verilog';
        if (path.endsWith('.vh')) return 'verilog';

        // Tcl
        if (path.endsWith('.tcl')) return 'tcl';

        // Cobol
        if (path.endsWith('.cob')) return 'cobol';
        if (path.endsWith('.cbl')) return 'cobol';

        // Pascal
        if (path.endsWith('.pas')) return 'pascal';
        if (path.endsWith('.p')) return 'pascal';

        // Smalltalk
        if (path.endsWith('.st')) return 'smalltalk';

        // Rexx
        if (path.endsWith('.rexx')) return 'rexx';
        if (path.endsWith('.rx')) return 'rexx';

        // Vala
        if (path.endsWith('.vala')) return 'vala';
        if (path.endsWith('.vapi')) return 'vala';

        // SASS
        if (path.endsWith('.sass')) return 'sass';
        if (path.endsWith('.scss')) return 'sass';

        // Elm
        if (path.endsWith('.elm')) return 'elm';

        // Terraform
        if (path.endsWith('.tf')) return 'terraform';
        if (path.endsWith('.tfvars')) return 'terraform';

        // Haxe
        if (path.endsWith('.hx')) return 'haxe';

        // Racket
        if (path.endsWith('.rkt')) return 'racket';
        // ActionScript
        if (path.endsWith('.as')) return 'actionscript';

        // Ada
        if (path.endsWith('.adb') || path.endsWith('.ads')) return 'ada';

        // COBOL
        if (path.endsWith('.cbl') || path.endsWith('.cob')) return 'cobol';

        // D
        if (path.endsWith('.d')) return 'd';

        // Elixir
        if (path.endsWith('.ex') || path.endsWith('.exs')) return 'elixir';

        // Forth
        if (path.endsWith('.4th') || path.endsWith('.fth') || path.endsWith('.frt')) return 'forth';

        // Julia
        if (path.endsWith('.jl')) return 'julia';

        // Lisp
        if (path.endsWith('.lisp') || path.endsWith('.lsp') || path.endsWith('.cl')) return 'lisp';

        // Objective-C
        if (path.endsWith('.m') || path.endsWith('.mm')) return 'objective-c';

        // OCaml
        if (path.endsWith('.ml') || path.endsWith('.mli')) return 'ocaml';

        // Prolog
        if (path.endsWith('.pl') || path.endsWith('.pro')) return 'prolog';

        // Scheme
        if (path.endsWith('.scm') || path.endsWith('.ss')) return 'scheme';

        // Smalltalk
        if (path.endsWith('.st')) return 'smalltalk';

        // Tcl
        if (path.endsWith('.tcl')) return 'tcl';

        // Verilog
        if (path.endsWith('.v') || path.endsWith('.vh')) return 'verilog';

        return 'plaintext';  // Lenguaje por defecto si no se reconoce la extensión
    }
});



document.addEventListener('DOMContentLoaded', () => {
    const chatLog = document.getElementById('chat-log');

    chatLog.addEventListener('click', (event) => {
        if (event.target.classList.contains('copy-btn')) {
            // Botón de copiar
            const codeBlock = event.target.closest('.code-block').querySelector('pre code'); // Obtener el <code> dentro del bloque
            let code = codeBlock.textContent;

            // Convertir entidades HTML a caracteres normales
            code = unescapeHTML(code);

            navigator.clipboard.writeText(code).then(() => {
            }).catch(err => {
                console.error('Error al copiar el código:', err);
            });

        } else if (event.target.classList.contains('run-btn')) {
            // Botón de ejecutar
            const codeBlock = event.target.closest('.code-block').querySelector('pre code'); // Obtener el <code> dentro del bloque
            let code = codeBlock.textContent;

            // Convertir entidades HTML a caracteres normales
            code = unescapeHTML(code);

            // Insertar el código en el editor de Monaco
            if (window.editor) {
                const position = editor.getPosition(); // Obtener la posición actual del cursor

                if (position) {
                    // Insertar el código en la posición actual del cursor
                    editor.executeEdits('', [{
                        range: new monaco.Range(position.lineNumber, 1, position.lineNumber, 1),
                        text: code,
                        forceMoveMarkers: true
                    }]);
                } else {
                    // Si no hay una posición previa, insertar el código en la línea 1
                    editor.setValue(code);
                }

            }
        }
    });

    // Función para convertir entidades HTML a caracteres normales
    function unescapeHTML(str) {
        const map = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&#39;': "'",
            '&quot;': '"'
        };
        return str.replace(/&amp;|&lt;|&gt;|&#39;|&quot;/g, (matched) => map[matched]);
    }
});


// Cargar los snapshots cuando se abra el panel
document.getElementById('snapshot-button').addEventListener('click', () => {
    fetch('/list-snapshots')
        .then(response => response.json())
        .then(data => {
            const snapshotList = document.getElementById('snapshot-list');
            snapshotList.innerHTML = ''; // Limpiar la lista actual

            data.snapshots.forEach(snapshot => {
                const listItem = document.createElement('li');
                listItem.textContent = snapshot.name;

                // Botón de restaurar para cada snapshot
                const restoreButton = document.createElement('button');
                restoreButton.textContent = 'Restore';
                restoreButton.addEventListener('click', () => {
                    fetch('/restore-snapshot', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ snapshot: snapshot.path }),
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                alert('Proyecto restaurado correctamente');
                            } else {
                                alert('Error al restaurar el proyecto');
                            }
                        });
                });

                listItem.appendChild(restoreButton);
                snapshotList.appendChild(listItem);
            });
        });
});



document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chat-input');
    const commandSuggestions = document.getElementById('command-suggestions');

    chatInput.addEventListener('input', (e) => {
        const text = e.target.value;

        // Mostrar sugerencias si el usuario escribe '@'
        if (text.endsWith('@')) {
            commandSuggestions.style.display = 'block';
            // Opcional: agrega lógica para filtrar comandos
        } else {
            commandSuggestions.style.display = 'none';
        }
    });

    // Manejar opción de limpiar la conversación
    document.getElementById('clean-command').addEventListener('click', () => {
        cleanConversations();
        chatInput.value = ''; // Opcional: limpiar el campo de entrada
        commandSuggestions.style.display = 'none'; // Ocultar sugerencias
    });
});

function cleanConversations() {
    fetch('/clean-conversations', {
        method: 'DELETE' // O el método que elijas para limpiar
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("Conversaciones limpiadas.");
                alert("Memory cleared.");
            } else {
                console.error(data.error);
            }
        })
        .catch(error => console.error("Error:", error));
}


function showAlert(message) {
    const alertContainer = document.getElementById('alert-container');
    const alertMessage = document.getElementById('alert-message');

    alertMessage.innerText = message;
    alertContainer.style.display = 'block'; // Mostrar la alerta

    // Opcional: esconder la alerta después de 3 segundos
    setTimeout(() => {
        alertContainer.style.display = 'none';
    }, 8000);
}

document.getElementById('add-file-btn').addEventListener('click', () => {
    const inputFileName = document.createElement('input');
    inputFileName.type = 'text';
    inputFileName.placeholder = 'Enter file name...';
    inputFileName.classList.add('input-file-name');
    document.querySelector('.file-panel').appendChild(inputFileName);

    inputFileName.style.display = 'block'; // Mostrar el campo de entrada

    inputFileName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const fileName = inputFileName.value.trim();
            if (fileName) {
                // Aquí llamarías a tu API/ función para crear el archivo
                createFile(fileName);
            }
            inputFileName.remove(); // Eliminar el campo de entrada después de usarlo
        }
    });

    inputFileName.focus(); // Enfocar el campo de entrada
});

function createFile(fileName) {
    if (!currentDirectoryPath) {
        alert('Por favor, selecciona un directorio primero.');
        return;
    }

    fetch('/create-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fileName, directory: currentDirectoryPath })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
        if (data.success) {
            alert('Archivo creado con éxito');

            // Refresca el listado de directorios en el file-panel
            const fileListElement = document.getElementById('file-list');
            fileListElement.innerHTML = '';  // Vaciar el contenido actual del file panel
            fetchDirectory(currentDirectoryPath, fileListElement);

            // Abre el nuevo archivo en blanco en el editor
            loadFile(data.filePath); // Asegúrate de que tu API devuelve la ruta del archivo creado
        } else {
            alert('Error al crear el archivo: ' + (data.error || 'Error desconocido'));
        }
    })
}

function showContextMenu(event, filePath, fileName) {
    const contextMenu = document.getElementById("contextMenu");
    const windowHeight = window.innerHeight;
    const menuHeight = contextMenu.offsetHeight;

    // Calcular si estamos cerca del borde inferior
    if (windowHeight - event.clientY < menuHeight) {
        // Si estamos cerca del borde inferior, mostrar hacia arriba
        contextMenu.style.top = `${event.clientY - menuHeight}px`;
    } else {
        // Mostrar el menú normalmente hacia abajo
        contextMenu.style.top = `${event.clientY}px`;
    }

    // Mostrar en la posición del mouse
    contextMenu.style.left = `${event.clientX}px`;
    contextMenu.style.display = "block";

    // Añadir eventos a las opciones del menú
    const renameOption = document.getElementById('renameOption');
    const deleteOption = document.getElementById('deleteOption');

    // Función para renombrar archivo
    renameOption.onclick = () => {
        showRenameInput(fileName, filePath); // Abrir el modal de renombrar
        hideContextMenu();
    };

    // Función para eliminar archivo
    deleteOption.onclick = () => {
        deleteFile(filePath);
        hideContextMenu();
    };
}


// Función para ocultar el menú contextual
function hideContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    contextMenu.style.display = 'none';
}

// Detectar clic fuera del menú para ocultarlo
document.addEventListener('click', () => {
    hideContextMenu();
});

function showRenameInput(filePath, fileName) {
    // Crear el input para el renombrado
    const inputRename = document.createElement('input');
    inputRename.type = 'text';
    inputRename.value = fileName; // Prellenar con el nombre del archivo actual
    inputRename.classList.add('input-rename');
    document.querySelector('.file-panel').appendChild(inputRename);

    inputRename.style.display = 'block'; // Mostrar el campo de entrada

    inputRename.focus(); // Enfocar el campo de entrada

    // Selecciona el contenedor donde quieras añadir el input
    const fileElement = document.querySelector(`[data-file-path="${filePath}"]`);
    if (fileElement) {
        fileElement.innerHTML = ''; // Limpiar el contenido anterior del archivo
        fileElement.appendChild(inputRename); // Añadir el input al archivo
    }

    // Cuando el usuario presione 'Enter', se intentará renombrar el archivo
    inputRename.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const newFileName = inputRename.value.trim();
            if (newFileName && newFileName !== fileName) {
                // Solo pasar el nombre del archivo al backend
                renameFile(fileName, newFileName); // Llama a la función para renombrar el archivo
            }
            inputRename.remove(); // Eliminar el input después de usarlo
        }
    });

    inputRename.focus(); // Enfocar el input para que el usuario pueda empezar a escribir de inmediato
}



// Función para enviar la solicitud al backend
function renameFile(oldPath, newName) {
    fetch('/rename-file', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            oldPath: oldPath,
            newName: newName
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Archivo renombrado correctamente');
                // Actualizar la interfaz
                // Refresca el listado de directorios en el file-panel
            const fileListElement = document.getElementById('file-list');
            fileListElement.innerHTML = '';  // Vaciar el contenido actual del file panel
            fetchDirectory(currentDirectoryPath, fileListElement); // Llama a tu función para refrescar la vista de archivos
            } else {
                alert(`Error al renombrar archivo: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error al renombrar el archivo:', error);
        });
}


// Función para eliminar archivo
function deleteFile(path) {
    if (confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
        fetch('/delete-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: path })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Archivo eliminado exitosamente');
                    // Actualizar la lista de archivos
                    // Refresca el listado de directorios en el file-panel
            const fileListElement = document.getElementById('file-list');
            fileListElement.innerHTML = '';  // Vaciar el contenido actual del file panel
            fetchDirectory(currentDirectoryPath, fileListElement);
                } else {
                    alert(`Error al eliminar archivo: ${data.error}`);
                }
            })
            .catch(error => {
                console.error('Error al eliminar archivo:', error);
            });
    }
}