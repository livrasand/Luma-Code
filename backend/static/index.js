
let fileNameModified = 'untitled';
let isMemoryEnabled = true; // Variable global para controlar el uso de memoria

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


const fileContentMap = {}; // Mapa para almacenar los contenidos de archivos

// Función para cargar el contenido de un archivo en el editor
function loadFile(path) {
    const fileContent = fileContentMap[path]; // Verificar si el archivo ya tiene contenido almacenado

    if (fileContent !== undefined) {
        // Si el archivo ya ha sido editado, cargar el contenido guardado
        setEditorContent(fileContent);
        const language = getFileLanguage(path);
        monaco.editor.setModelLanguage(editor.getModel(), language); // Cambiar el lenguaje del editor
        updateStatusBar(path, fileContent);
        addTab(path);
    } else {
        // Si no tiene contenido almacenado, cargar desde el servidor
        fetch('/read-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        })
        .then(response => response.json())
        .then(data => {
            if (data.content !== undefined) { // Verificamos si hay contenido (incluso si está vacío)
                // Establecer el contenido del archivo, aunque esté vacío
                editor.setValue(data.content);

                // Guardar el contenido en el mapa para evitar futuras recargas
                fileContentMap[path] = data.content;
                
                updateStatusBar(path, data.content);
                // Obtener el nombre del archivo sin la extensión
                const fileName = path.split('\\').pop();
                isModified = false; // Establecer como no modificado
                updateFileName(); // Actualizar el nombre en la barra de estado
                fileNameModified = fileName;

                // Obtener el lenguaje de programación basado en la extensión del archivo
                const language = getFileLanguage(path);

                // Establecer el lenguaje en el modelo del editor
                monaco.editor.setModelLanguage(editor.getModel(), language);

                // Guardar la ruta del archivo actual
                currentFilePath = path;

                
                // Calcular la cantidad de líneas
                const lineCount = data.content.split('\n').length || 1; // Si está vacío, considerar al menos 1 línea

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

                // Llamada a addTab para agregar una pestaña para este archivo
                addTab(path);

            } else if (data.error) {
                console.error('Error al cargar el archivo:', data.error);
            }
        })
        .catch(error => {
            console.error('Error al leer el archivo:', error);
        });
    }
}

// Función para establecer el contenido en el editor (puede adaptarse según tu implementación)
function setEditorContent(content) {
    editor.setValue(content); // Usar tu instancia del editor para establecer el valor
}


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
        chatLog.innerHTML += `<p><strong class="user-message">You:</strong> ${marked(message)}</p>`;
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
            }

            // Procesar la respuesta
            if (data.response) {
                let formattedResponse = marked(data.response);
                formattedResponse = formatResponse(formattedResponse);
                chatLog.innerHTML += `<p><strong class="gpt-message">Luma:</strong> ${formattedResponse}</p>`;
                Prism.highlightAll(); // Aplicar resaltado de sintaxis
            } else if (data.error) {
                chatLog.innerHTML += `<p><strong>Error:</strong> ${data.error}</p>`;
            }

            // Guardar la conversación si la memoria está habilitada
            if (isMemoryEnabled) {
                saveConversationToFile(message, data.response);
            }
        } catch (error) {
            
        }
    }
}

    


    function formatResponse(response) {
        // Busca bloques de código en la respuesta y añade los botones
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = response;

        // Encuentra todos los bloques <pre><code>
        const codeBlocks = tempDiv.querySelectorAll('pre');

        codeBlocks.forEach((block) => {
            // Crear un contenedor para el bloque de código y los botones
            const container = document.createElement('div');
            container.classList.add('code-block');

            // Crear el botón de copiar
            const copyButton = document.createElement('button');
            copyButton.classList.add('copy-btn');

            // Crear el SVG
            const svgIconCopy = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width=".75rem" height=".75rem" fill="#fff" style="margin-top:3px;margin-right:3px;"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path></svg>
        `;

            // Inserta el SVG en el botón
            copyButton.innerHTML = svgIconCopy + ' Copy';

            // Crear el botón de ejecutar
            const runButton = document.createElement('button');
            runButton.classList.add('run-btn');
            const svgIconRun = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width=".75rem" height=".75rem" fill="#fff" style="margin-top:3px;margin-right:3px;"><path d="M9.504.43a1.516 1.516 0 0 1 2.437 1.713L10.415 5.5h2.123c1.57 0 2.346 1.909 1.22 3.004l-7.34 7.142a1.249 1.249 0 0 1-.871.354h-.302a1.25 1.25 0 0 1-1.157-1.723L5.633 10.5H3.462c-1.57 0-2.346-1.909-1.22-3.004L9.503.429Zm1.047 1.074L3.286 8.571A.25.25 0 0 0 3.462 9H6.75a.75.75 0 0 1 .694 1.034l-1.713 4.188 6.982-6.793A.25.25 0 0 0 12.538 7H9.25a.75.75 0 0 1-.683-1.06l2.008-4.418.003-.006a.036.036 0 0 0-.004-.009l-.006-.006-.008-.001c-.003 0-.006.002-.009.004Z"></path></svg>
        `;
            runButton.innerHTML = svgIconRun + 'Run';

            // Insertar los botones antes del bloque de código
            container.appendChild(copyButton);
            container.appendChild(runButton);
            container.appendChild(block.cloneNode(true)); // Clonar el bloque de código para moverlo

            // Reemplazar el bloque de código original con el nuevo contenedor
            block.parentNode.replaceChild(container, block);
        });

        return tempDiv.innerHTML;  // Devolver el HTML modificado
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
            // Refresca el listado de directorios en el file-panel
            const fileListElement = document.getElementById('file-list');
            fileListElement.innerHTML = '';  // Vaciar el contenido actual del file panel
            fetchDirectory(currentDirectoryPath, fileListElement);

            // Abre el nuevo archivo en blanco en el editor
            loadFile(data.filePath); // Aquí asegúrate de que el API devuelve la ruta correcta
        } else {
            alert('Error al crear el archivo: ' + (data.error || 'Error desconocido'));
        }
    })
    .catch(error => {
        console.error('Error al crear el archivo:', error);
    });
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

// Función para renombrar archivos
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
            // Actualizar la interfaz
            const fileListElement = document.getElementById('file-list');
            fileListElement.innerHTML = '';  // Vaciar el contenido actual del file panel
            fetchDirectory(currentDirectoryPath, fileListElement); // Refresca la vista de archivos

            // Restablecer el input si es necesario
            const renameInput = document.getElementById('rename-input');
            if (renameInput) {
                renameInput.value = '';  // Limpiar el valor del input
                renameInput.disabled = false;  // Asegurarse de que esté habilitado
            }
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

const tabsContainer = document.getElementById('tabs');

// Función para agregar una nueva pestaña o activar una existente
function addTab(filePath) {
    const existingTab = Array.from(tabsContainer.children).find(tab => tab.dataset.path === filePath);

    if (existingTab) {
        activateTab(existingTab);
        return;
    }

    const tab = document.createElement('div');
    tab.classList.add('tab');
    tab.textContent = filePath.split('\\').pop(); // Mostrar solo el nombre del archivo
    tab.dataset.path = filePath;

    // Crear el botón de cerrar para la pestaña
    const closeButton = createCloseButton(tab);
    tab.appendChild(closeButton);

    tab.addEventListener('click', () => {
        // Guardar el contenido actual antes de cambiar de pestaña
        saveCurrentFileContent();

        // Cargar el archivo correspondiente en el editor
        loadFile(filePath);
        activateTab(tab);
    });

    tabsContainer.appendChild(tab);
    activateTab(tab); // Activa la nueva pestaña
}

// Función para crear el botón de cerrar (con SVG)
function createCloseButton(tab) {
    const closeButton = document.createElement('span');
    closeButton.classList.add('close');

    const closeIconSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    closeIconSVG.setAttribute('viewBox', '0 0 12 12');
    closeIconSVG.setAttribute('width', '12');
    closeIconSVG.setAttribute('height', '12');
    closeIconSVG.setAttribute('fill', '#abb2bf');

    const closeIconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    closeIconPath.setAttribute('d', 'M2.22 2.22a.749.749 0 0 1 1.06 0L6 4.939 8.72 2.22a.749.749 0 1 1 1.06 1.06L7.061 6 9.78 8.72a.749.749 0 1 1-1.06 1.06L6 7.061 3.28 9.78a.749.749 0 1 1-1.06-1.06L4.939 6 2.22 3.28a.749.749 0 0 1 0-1.06Z');

    closeIconSVG.appendChild(closeIconPath);
    closeButton.appendChild(closeIconSVG);

    closeButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Evitar que el clic cierre la pestaña
        closeTab(tab);
    });

    return closeButton;
}

// Función para activar una pestaña
function activateTab(tab) {
    // Desactivar todas las pestañas
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('active'));

    // Activar la pestaña seleccionada
    tab.classList.add('active');
}

// Función para cerrar una pestaña
function closeTab(tab) {
    tab.remove(); // Eliminar la pestaña
    delete fileContentMap[tab.dataset.path];  // Si decides eliminar el caché al cerrar tab

    // Verificar si quedan más pestañas abiertas
    const remainingTabs = document.querySelectorAll('.tab');
    
    if (remainingTabs.length === 0) {
        // Si no quedan pestañas, limpiar el editor
        editor.setValue(''); // Limpiar el contenido del editor
        currentFilePath = null; // Resetear la ruta del archivo actual
        updateFileName(''); // Limpiar el nombre del archivo en la barra de estado (puedes crear esta función si no la tienes)
    } else {
        // Si hay más pestañas, activa la última pestaña restante
        const lastTab = remainingTabs[remainingTabs.length - 1];
        const lastFilePath = lastTab.dataset.path;
        loadFile(lastFilePath); // Cargar el contenido de la última pestaña en el editor
        activateTab(lastTab); // Activar la última pestaña
    }
}


// Función para guardar el contenido actual del editor
function saveCurrentFileContent() {
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        const filePath = activeTab.dataset.path;
        const currentContent = getEditorContent(); // Función que obtiene el contenido actual del editor
        fileContentMap[filePath] = currentContent; // Guardar el contenido en el mapa
    }
}

// Función que obtiene el contenido actual del editor (depende de tu implementación)
function getEditorContent() {
    // Aquí deberías implementar cómo obtener el contenido actual del editor
    return editor.getValue(); // Por ejemplo, si usas Monaco Editor
}

// Función para actualizar la barra de estado
function updateStatusBar(filePath, content) {
    // Obtener el nombre del archivo sin la extensión
    const fileName = filePath.split('\\').pop() || filePath.split('/').pop();
    const language = getFileLanguage(filePath);

    // Calcular la cantidad de líneas
    const lineCount = content.split('\n').length || 1; // Si está vacío, considerar al menos 1 línea

    // Calcular el tamaño del archivo en bytes
    const fileSize = new Blob([content]).size; // Tamaño en bytes
    const sizeInKB = (fileSize / 1024).toFixed(2); // Tamaño en KB
    const sizeInMB = (fileSize / (1024 * 1024)).toFixed(2); // Tamaño en MB

    const statusFileTitle = document.getElementById('status-file-title');
    const statusCursorPosition = document.getElementById('status-cursor-position');
    const statusFileLanguage = document.getElementById('status-file-language');
    const statusFileInfo = document.getElementById('status-file-info');

    statusFileTitle.textContent = fileName; // Mostrar el nombre del archivo
    statusCursorPosition.textContent = `1:1`; // Inicializar la posición del cursor
    statusFileLanguage.textContent = language; // Mostrar el lenguaje del archivo
    statusFileInfo.textContent = `${lineCount} lines · ${fileSize < 2048 ? sizeInKB + ' KB' : sizeInMB + ' MB'}`;
}

document.addEventListener('DOMContentLoaded', () => {
    // Manejar opción de toggle memory
    document.getElementById('toggle-memory-command').addEventListener('click', () => {
        const commandSuggestions = document.getElementById('command-suggestions');
        toggleMemoryUsage();
        const message = isMemoryEnabled ? "Memory is now enabled." : "Memory is now disabled.";
        alert(message); // Informar al usuario
        document.getElementById('chat-input').value = '';
        commandSuggestions.style.display = 'none'; // Ocultar sugerencias // Limpiar el input
    });
});

function toggleMemoryUsage() {
    // Alternar el estado de la memoria
    isMemoryEnabled = !isMemoryEnabled;

    // Enviar la configuración al servidor si es necesario
    fetch('/toggle-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryEnabled: isMemoryEnabled })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Error updating memory settings:', data.error);
            alert('Error toggling memory usage.');
        }
    })
    .catch(error => {
        console.error('Error connecting to the server:', error);
    });
}

