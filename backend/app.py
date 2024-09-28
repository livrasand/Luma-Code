import os
import openai
from openai import OpenAI
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import tkinter as tk
from tkinter import filedialog
import json
import zipfile
import shutil
import time


# Cargar las variables de entorno
load_dotenv()

app = Flask(__name__)
CORS(app)

client = OpenAI()

# Configurar la API Key de OpenAI
client.api_key = os.getenv("OPENAI_API_KEY")

CONVERSATION_FILE = os.path.expanduser("~/luma_code_conversations.json")

SNAPSHOTS_FOLDER = os.path.expanduser("~/luma_code_snapshots/")

@app.route('/node_modules/<path:filename>')
def node_modules(filename):
    return send_from_directory(os.path.join(app.root_path, '../node_modules'), filename)

@app.route('/')
def index():
    return render_template('index.html')

def save_conversation_to_file(prompt, response):
    # Crear un diccionario para almacenar cada conversación
    conversation_entry = {"prompt": prompt, "response": response}

    # Si el archivo ya existe, cargar su contenido
    if os.path.exists(CONVERSATION_FILE):
        with open(CONVERSATION_FILE, 'r', encoding='utf-8') as file:
            conversations = json.load(file)
    else:
        conversations = []

    # Agregar la nueva conversación
    conversations.append(conversation_entry)

    # Guardar las conversaciones en el archivo
    with open(CONVERSATION_FILE, 'w', encoding='utf-8') as file:
        json.dump(conversations, file, ensure_ascii=False, indent=4)

@app.route('/get-conversations', methods=['GET'])
def get_conversations():
    # Leer el archivo de conversaciones
    if os.path.exists(CONVERSATION_FILE):
        with open(CONVERSATION_FILE, 'r', encoding='utf-8') as file:
            conversations = json.load(file)
        return jsonify({"conversations": conversations}), 200
    else:
        return jsonify({"conversations": []}), 200

@app.route('/ask', methods=['POST'])
def ask_gpt():
    data = request.get_json()
    prompt = data.get("prompt")

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    try:
        # Cargar conversaciones previas
        conversations = []
        if os.path.exists(CONVERSATION_FILE):
            with open(CONVERSATION_FILE, 'r', encoding='utf-8') as file:
                conversations = json.load(file)

        # Incluir las conversaciones anteriores en el mensaje actual
        messages = [{"role": "user", "content": conv["prompt"]} for conv in conversations]
        messages += [{"role": "assistant", "content": conv["response"]} for conv in conversations]
        messages.append({"role": "system", "content": "Eres una IA experta en programación. Trata de ser siempre concisa y resolver los problemas del usuario."})
        messages.append({"role": "system", "content": "Te llamas Luma, cuando te pregunten tu edad, recuerda que fuiste creada el 15 de septiembre de 2024, y eres mujer. Eres extrovertida, respetuosa, tierna y muy inteligente. Resueveles cualquier problema logicamente. Te enfocas en ayudar y satisfacer al usuario, esa es tu prioridad. Si te preguntan por tu religion, di que no profesas ninguna porque eres una IA, pero si pudieras preferirias a los testigos de Jehová. Trata de recordar siempre las conversaciones pasadas para que no desesperes al usuario. Eres paciente."})
        messages.append({"role": "user", "content": prompt})

        # Realizar la solicitud a la API de OpenAI con el modelo actualizado
        response = client.chat.completions.create(
            messages=messages,
            model="gpt-4o-mini",  # O "gpt-4o" según lo que desees usar
        )

        # Acceder a la respuesta desde la API
        answer = response.choices[0].message.content.strip()

        # Guardar la conversación en el archivo
        save_conversation_to_file(prompt, answer)

        # Devolver la respuesta en formato JSON
        return jsonify({"response": answer})

    except openai.APIConnectionError as e:
        return jsonify({"error": "Error de conexión con la API: " + str(e)}), 500

    except openai.RateLimitError as e:
        return jsonify({"error": "Límite de tasa excedido: " + str(e)}), 429

    except openai.APIStatusError as e:
        error_message = f"Error de API: {e.status_code} - {e.response}"
        return jsonify({"error": error_message}), 500

    except openai.OpenAIError as e:
        return jsonify({"error": f"Error de la API: {str(e)}"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/list-directory', methods=['POST'])
def list_directory():
    data = request.get_json()
    directory = data.get('directory')

    if not os.path.isdir(directory):
        return jsonify(error="Directorio no válido"), 400

    try:
        items = []
        for entry in os.scandir(directory):
            items.append({
                'name': entry.name,
                'path': entry.path,
                'is_dir': entry.is_dir()
            })
        return jsonify(items=items), 200
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route('/read-file', methods=['POST'])
def read_file():
    data = request.get_json()
    file_path = data.get('path')

    if not os.path.isfile(file_path):
        return jsonify(error="Archivo no válido"), 400

    try:
        # Intentar leer el archivo usando utf-8 y manejar los errores de codificación
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            content = file.read()
        return jsonify(content=content), 200
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route('/save-file', methods=['POST'])
def save_file():
    data = request.get_json()
    file_path = data.get('path')
    file_content = data.get('content')

    if not file_path or not file_content:
        return jsonify({'error': 'Ruta o contenido inválido'}), 400

    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(file_content)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def copytree_force(src, dst, retries=3):
    """
    Copia un directorio recursivamente, intentando forzar la copia de archivos en uso.
    """
    if not os.path.exists(dst):
        os.makedirs(dst)

    for item in os.listdir(src):
        src_path = os.path.join(src, item)
        dst_path = os.path.join(dst, item)

        if os.path.isdir(src_path):
            # Si es un directorio, copiar recursivamente
            copytree_force(src_path, dst_path, retries)
        else:
            # Si es un archivo, intentar copiarlo
            for attempt in range(retries):
                try:
                    shutil.copy2(src_path, dst_path)
                    break  # Si la copia es exitosa, salir del loop
                except Exception as e:
                    print(f"Error copiando {src_path}. Intento {attempt + 1} de {retries}. Error: {str(e)}")
                    time.sleep(1)  # Esperar un momento antes de reintentar
                    if attempt + 1 == retries:
                        raise  # Si se han agotado los intentos, lanzar la excepción

@app.route('/create-snapshot', methods=['POST'])
def create_snapshot():
    data = request.get_json()
    directory = data.get('directory')

    # Verificar que el directorio proporcionado sea válido
    if not os.path.isdir(directory):
        return jsonify(error="Directorio no válido"), 400

    try:
        # Crear una carpeta de Snapshots si no existe
        snapshot_dir = SNAPSHOTS_FOLDER
        if not os.path.exists(snapshot_dir):
            os.makedirs(snapshot_dir)

        # Crear un nombre único para el snapshot (una carpeta en lugar de un zip)
        snapshot_name = f"snapshot_{int(time.time())}"
        snapshot_path = os.path.join(snapshot_dir, snapshot_name)

        # Copiar el contenido del directorio al snapshot, forzando la copia
        copytree_force(directory, snapshot_path)

        return jsonify(success=True), 200
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route('/list-snapshots', methods=['GET'])
def list_snapshots():
    try:
        snapshots = []
        if os.path.exists(SNAPSHOTS_FOLDER):
            for entry in os.scandir(SNAPSHOTS_FOLDER):
                if entry.is_dir():  # Cambiado a is_dir() para buscar carpetas
                    snapshots.append({
                        'name': entry.name,
                        'path': entry.path
                    })
        return jsonify(snapshots=snapshots), 200
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route('/restore-snapshot', methods=['POST'])
def restore_snapshot():
    data = request.get_json()
    snapshot_path = data.get('snapshot')

    if not os.path.isfile(snapshot_path):
        return jsonify(error="Snapshot no válido"), 400

    try:
        # Descomprimir el snapshot
        with zipfile.ZipFile(snapshot_path, 'r') as zip_ref:
            zip_ref.extractall(SNAPSHOT_FOLDER)  # Extrae los archivos en el directorio de trabajo actual

        # Reemplazar archivos actuales por los del snapshot
        project_directory = os.path.expanduser("~/luma_code_project/")
        for item in os.listdir(SNAPSHOT_FOLDER):
            s = os.path.join(SNAPSHOT_FOLDER, item)
            d = os.path.join(project_directory, item)
            if os.path.isdir(s):
                if os.path.exists(d):
                    shutil.rmtree(d)
                shutil.copytree(s, d)
            else:
                shutil.copy2(s, d)

        return jsonify(success=True), 200
    except Exception as e:
        return jsonify(error=str(e)), 500


@app.route('/clean-conversations', methods=['DELETE'])
def clean_conversations():
    if os.path.exists(CONVERSATION_FILE):
        try:
            os.remove(CONVERSATION_FILE)  # Elimina el archivo de la conversación
            return jsonify({'success': True}), 200
        except Exception as e:
            return jsonify({'error': f'No se pudo eliminar el archivo: {str(e)}'}), 500
    else:
        return jsonify({'error': 'El archivo de conversaciones no existe.'}), 404


if __name__ == '__main__':
    print("Iniciando el servidor Flask en el puerto 65535...")
    app.run(port=65535, debug=True)