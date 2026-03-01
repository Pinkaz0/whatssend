from flask import Flask, request, jsonify
from actseguimiento_final_ok_COMPLETO_FUNCIONAL import lock_and_run, verificar_bloqueos_huerfanos

app = Flask(__name__)

# Verificar bloqueos al iniciar la aplicación
verificar_bloqueos_huerfanos()

@app.route('/consultar', methods=['POST'])
def consultar():
    data = request.get_json()
    orden = data.get("orden", "")
    if not orden:
        return jsonify({"error": "Falta el número de orden"}), 400

    resultado = lock_and_run(orden)
    return jsonify(resultado)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000) 