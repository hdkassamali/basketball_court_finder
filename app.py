from flask import Flask, render_template, redirect, flash, request, session, g
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

CURR_USER_KEY = "curr_user"

######## HELPER FUNCTIONS #######


@app.before_request
def add_user_to_g():
    """If a user is logged in, add curr user to Flask global."""

    if CURR_USER_KEY in session:
        g.user = User.query.get(session[CURR_USER_KEY])
    else:
        g.user = None


def do_login(user):
    """Log in a user."""
    session[CURR_USER_KEY] = user.id


def do_logout():
    """Logout user."""
    if CURR_USER_KEY in session:
        del session[CURR_USER_KEY]


def login_required(f):
    """Decorator to ensure a user is logged in before accesing a route."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not g.user:
            flash("Please login first!", "danger")
            return redirect("/login")
        return f(*args, **kwargs)

    return decorated_function


def check_user_authorized(username):
    """Redirects the user to their own profile page if they attempt to access another user's profile page."""

    if username != g.user.username:
        flash("You are not authorized to access this page", "danger")
        return redirect(f"users/{g.user.username}/user_profile")


def handle_update_user_profile_form(user, form):
    """Updates user profile with form data and commits changes to the database. Redirect response to the user's page after updating profile."""

    ### TODO ###


####### ROUTES #######


@app.route("/")
def home():
    """Home Page when no user is logged in."""
    return render_template("homepage.html")


### USER REGISTRATION/LOGIN ROUTES ###


@app.route("/register", methods=["GET", "POST"])
def register():
    """
    Handles user registration. Creates a new user and adds to DB. Redirects to their user page.

    GET: Displays the registration form.
    POST: Validates and processes registration data, then creates a new user.
    """

    form = RegisterForm()

    if form.validate_on_submit():
        try:
            new_user = User.register(
                username=form.username.data,
                password=form.password.data,
                email=form.email.data,
                first_name=form.first_name.data,
                last_name=form.last_name.data,
                bio=form.bio.data,
                location=form.location.data,
            )
            db.session.add(new_user)
            db.session.commit()

        except IntegrityError as e:
            db.session.rollback()
            app.logger.error(f"IntegrityError: {e}")
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

        do_login(new_user)

        flash(
            f"Hey {new_user.username}! Welcome to The Court Connect. Start finding courts near you!",
            "success",
        )
        return redirect(f"/users/{new_user.username}/user_profile")

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
        user = User.authenticate(
            username=form.username.data, password=form.password.data
        )

        if user:
            flash(f"Welcome back, {user.username}!", "success")
            do_login(user)
            return redirect(f"/users/{user.username}/user_profile")
        else:
            form.username.errors = ["Invalid username/password"]

    return render_template("login.html", form=form)


@app.route("/logout")
@login_required
def logout():
    """Handle logout of user."""

    do_logout()
    flash("Successfully logged out. See ya at the next hoop sesh ✊", "success")
    return redirect("/login")


### USER PROFILE ROUTES ###


@app.route("/users/<username>/user_profile")
@login_required
def show_user_profile(username):
    """When a user is logged in, show the user's profile information."""

    check_user_authorized(username)

    return render_template("user_profile_page.html", user=g.user)

@app.route("/users/<username>/edit_profile", methods=["GET", "POST"])
@login_required
def edit_user_profile(username):
    """
    Edit a user's proflle.

    GET: Pre-fills the Register form with existing user data.
    POST: Validates and updates the edited user data in the database.
    """
    #TODO

