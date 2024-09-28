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

                        if (data.response) {
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
 
 document.addEventListener('DOMContentLoaded', () => {
    const { ipcRenderer } = window;
    let currentDirectoryPath = '';
    let currentFilePath = '';
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
                
                // Añadir ícono
                const icon = document.createElement('i');
                icon.className = item.is_dir ? 'folder' : 'file-icon';
                li.appendChild(icon);

                li.appendChild(document.createTextNode(item.name));

                if (item.is_dir) {
    li.classList.add('folder');
    li.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDirectory(item.path, li);
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
    
let fileName = 'untitled'; // Variable para el nombre del archivo
let isModified = false; // Variable para verificar si se ha modificado

// Función para actualizar el nombre del archivo en la barra de estado
function updateFileName() {
    const displayFileName = isModified ? fileName + '*' : fileName;
    document.getElementById('status-file-title').textContent = displayFileName;
}

editor.onDidChangeModelContent((event) => {
    isModified = true;
    updateFileName();
});

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
                fileName = path.split('\\').pop();
                isModified = false; // Establecer como no modificado
                updateFileName(); // Actualizar el nombre en la barra de estado

                // Obtener el lenguaje de programación basado en la extensión del archivo
                const language = getFileLanguage(path);

                // Establecer el lenguaje en el modelo del editor
                monaco.editor.setModelLanguage(editor.getModel(), language);

                // Guardar la ruta del archivo actual
                currentFilePath = path;

            } else if (data.error) {
                console.error('Error al cargar el archivo:', data.error);
            }
        })
        .catch(error => {
            console.error('Error al leer el archivo:', error);
        });
    }

    // Evento para crear un Snapshot
document.getElementById('backup-directory-button').addEventListener('click', function() {
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

   
// Función para guardar el contenido del editor en el archivo
function saveFile() {
    const fileContent = editor.getValue();

    if (currentFilePath) {
        fetch('/save-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: currentFilePath, content: fileContent })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                isModified = false; // Marcar como no modificado
                updateFileName(); // Actualizar el nombre en la barra de estado
            } else {
                console.error('Error al guardar el archivo:', data.error);
            }
        })
        .catch(error => {
            console.error('Error al realizar la solicitud:', error);
        });
    }
}


    // Detectar Ctrl + S para guardar
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();  // Evitar la acción por defecto del navegador (guardar página)
            saveFile();          // Llamar a la función de guardado
        }
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
    const { ipcRenderer } = window;

    document.getElementById('send-btn').addEventListener('click', async () => {
        const message = document.getElementById('chat-input').value;
        const chatLog = document.getElementById('chat-log');

        if (message.trim()) {
            // Agregar el mensaje del usuario al chat
            chatLog.innerHTML += `<p><strong class="user-message">You:</strong> ${escapeHTML(message)}</p>`;
            document.getElementById('chat-input').value = ''; // Limpiar el input

            try {
                // Enviar el mensaje al servidor
                const response = await fetch('/ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: message }),
                });

                const data = await response.json();

                if (data.response) {
                    let formattedResponse = escapeHTML(data.response);

                    // Detectar y formatear bloques de código con tres backticks ```...```
                    formattedResponse = formattedResponse.replace(/```([a-zA-Z]*)([\s\S]*?)```/g, (match, lang, code) => {
                        const language = lang || 'plaintext'; // Si no hay lenguaje, usar texto plano
                        const escapedCode = escapeHTML(code);

                        return `
                            <div class="code-block">
                                <pre><code class="language-${escapeHTML(language)}">${escapedCode}</code></pre>
                                <button class="copy-btn">Copiar</button>
                                <button class="run-btn">Run</button>
                            </div>`;
                    });


                    // Detectar y formatear código inline con un backtick `
                    formattedResponse = formattedResponse.replace(/`([^`]+)`/g, (match, code) => {
                        return `<code class="inline-code">${escapeHTML(code)}</code>`;
                    });

                    // Formatear encabezados markdown
                    formattedResponse = formattedResponse.replace(/(^|\n)### (.*?)(\n|$)/g, '<h3>$2</h3>');
                    formattedResponse = formattedResponse.replace(/(^|\n)## (.*?)(\n|$)/g, '<h2>$2</h2>');
                    formattedResponse = formattedResponse.replace(/(^|\n)# (.*?)(\n|$)/g, '<h1>$2</h1>');

                    // Convertir enlaces markdown [texto](url)
                    formattedResponse = formattedResponse.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

                    // Agregar la respuesta de ChatGPT al chat
                    chatLog.innerHTML += `<p><strong class="gpt-message">Luma:</strong> ${formattedResponse}</p>`;
                    Prism.highlightAll(); // Aplicar resaltado de sintaxis
                } else if (data.error) {
                    chatLog.innerHTML += `<p><strong>Error:</strong> ${data.error}</p>`;
                }
            } catch (error) {
                chatLog.innerHTML += `<p><strong>Error:</strong> No se pudo conectar con el servidor.</p>`;
            }
        }
    });

    // Función para escapar caracteres HTML
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

