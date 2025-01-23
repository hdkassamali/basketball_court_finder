from flask import Flask, render_template, redirect, flash, request, session
from flask_debugtoolbar import DebugToolbarExtension
from models import connect_db, User, Court, db
import os

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql:///basketball_court_finder_db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ECHO"] = True
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["DEBUG_TB_INTERCEPT_REDIRECTS"] = False
toolbar = DebugToolbarExtension(app)

# When working in ipython, running seed file, or when using unittest framework run the line below:
# app.app_context().push()

connect_db(app)


### ROUTES ###

@app.route("/")
def home():
    """Home Page"""
    return render_template("homepage.html")