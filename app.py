from flask import Flask, jsonify
import secrets

app = Flask(__name__)

def generate_key():
    suffix = secrets.token_hex(10)  # 20 ký tự hex
    return f"Phucan_{suffix}"

@app.route('/getkey', methods=['GET'])
def get_key():
    key = generate_key()
    with open("keys.txt", "a") as f:
        f.write(key + "\n")
    return jsonify({"key": key})

if __name__ == "__main__":
    app.run()
