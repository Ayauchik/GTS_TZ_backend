from flask import Flask, request, jsonify

app = Flask(__name__)

# --- Dummy Users ---
dummy_users = [
    {
        "id": 1,
        "name": "Admin User",
        "login": "admin",
        "password": "admin123",
        "role": "ADMIN"
    },
    {
        "id": 2,
        "name": "Иван Петров",
        "login": "ivan_p",
        "password": "pass1",
        "role": "AUTHOR"
    },
    {
        "id": 3,
        "name": "Мария Сидорова",
        "login": "maria_s",
        "password": "pass2",
        "role": "AUTHOR"
    },
    {
        "id": 4,
        "name": "Сергей Васильев",
        "login": "sergey_v",
        "password": "pass3",
        "role": "MODERATOR"
    }
]

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    login = data.get('login')
    password = data.get('password')

    for user in dummy_users:
        if user["login"] == login and user["password"] == password:
            return jsonify({
                "id": user["id"],
                "name": user["name"],
                "role": user["role"]
            }), 200

    return jsonify({"error": "Invalid login or password"}), 401


if __name__ == '__main__':
    app.run(debug=True)
