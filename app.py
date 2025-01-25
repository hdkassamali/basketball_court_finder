from flask import Flask, render_template, redirect, flash, request, session
from flask_debugtoolbar import DebugToolbarExtension
from models import connect_db, User, Court, db
from forms import RegisterForm, LoginForm
from functools import wraps
from sqlalchemy.exc import IntegrityError
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


######## HELPER FUNCTIONS #######


def login_required(f):
    """Decorator to ensure a user is logged in before accesing a route."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "username" not in session:
            flash("Please login first!", "danger")
            return redirect("/login")
        return f(*args, **kwargs)

    return decorated_function


def check_user_authorized(username):
    """Redirects the user to their own page if they attempt to access another user's page."""

    if session.get("username") != username:
        flash("You are not authorized to access this page", "danger")
        return redirect(f"users/{session['username']}")
    return None


def handle_update_user_profile_form(user, form):
    """Updates user profile with form data and commits changes to the database. Redirect response to the user's page after updating profile."""


####### ROUTES #######


@app.route("/")
def home():
    """Home Page"""
    return render_template("homepage.html")


### USER REGISTRATION/LOGIN ROUTES ###


@app.route("/register", methods=["GET", "POST"])
def register():
    """
    Handles user registration.

    GET: Displays the registration form.
    POST: Validates and processes registration data, then creates a new user.
    """

    form = RegisterForm()
    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data
        email = form.email.data
        first_name = form.first_name.data
        last_name = form.last_name.data
        bio = form.bio.data
        location = form.location.data
        new_user = User.register(
            username, password, email, first_name, last_name, bio, location
        )

        db.session.add(new_user)
        try:
            db.session.commit()
        except IntegrityError as e:
            db.session.rollback()
            if "username" in str(e.orig):
                form.username.errors.append(
                    "Sorry! Another fellow hooper has already claimed that username. Please choose another username!"
                )
            elif "email" in str(e.orig):
                form.email.errors.append(
                    "Hold up Player! Another person is using this email address already. Try again please!"
                )
            else:
                flash("An unexpected error occured. Please try again", "danger")
            return render_template("register.html", form=form)

        session["username"] = new_user.username

        flash(
            f"Hey {new_user.username}! Welcome to Where You Hooping? Start finding courts near you!",
            "success",
        )
        return redirect(f"/users/{new_user.username}")

    return render_template("register.html", form=form)


@app.route("/login", methods=["GET", "POST"])
def login():
    """
    Handles user login.

    GET: Displays the login form.
    POST: Authenticates the user and starts a session.
    """

    form = LoginForm()
    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data

        user = User.authenticate(username, password)

        if user:
            flash(f"Welcome back, {user.username}!", "success")
            session["username"] = user.username
            return redirect(f"/users/{user.username}")
        else:
            form.username.errors = ["Invalid username/password"]

    return render_template("login.html", form=form)
