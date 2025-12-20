# run_app.py
from flask import Flask
from ai_routes import ai_bp

app = Flask(__name__)
app.register_blueprint(ai_bp)

if __name__ == "__main__":
    app.run(debug=True)
