import os
import openai
from openai import OpenAI
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Cargar las variables de entorno
load_dotenv()

app = Flask(__name__)
CORS(app)

client = OpenAI()

# Configurar la API Key de OpenAI
client.api_key = os.getenv("OPENAI_API_KEY")

@app.route('/node_modules/<path:filename>')
def node_modules(filename):
    return send_from_directory(os.path.join(app.root_path, '../node_modules'), filename)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ask', methods=['POST'])
def ask_gpt():
    data = request.get_json()
    prompt = data.get("prompt")

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    try:
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="gpt-4o-mini",
        )

        # Access the answer using the updated method
        answer = response.choices[0].message.content.strip()
        return jsonify({"response": answer})

    except openai.APIConnectionError as e:
        # Error de conexión con la API
        return jsonify({"error": "Error de conexión con la API: " + str(e)}), 500

    except openai.RateLimitError as e:
        # Límite de tasa excedido
        return jsonify({"error": "Límite de tasa excedido: " + str(e)}), 429

    except openai.APIStatusError as e:
        # Otro código de estado no 200 recibido
        error_message = f"Error de API: {e.status_code} - {e.response}"
        return jsonify({"error": error_message}), 500

    except openai.OpenAIError as e:
        # Error general de OpenAI
        return jsonify({"error": f"Error de la API: {str(e)}"}), 500

    except Exception as e:
        # Otros errores inesperados
        return jsonify({"error": str(e)}), 500

@app.route('/list-directory', methods=['POST'])
def list_directory():
    data = request.get_json()
    directory_path = data.get('directory')

    if not directory_path:
        return jsonify({'error': 'No directory path provided'}), 400

    try:
        # Obtiene la lista de archivos y directorios
        items = [{'name': item} for item in os.listdir(directory_path)]
        return jsonify({'items': items})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)