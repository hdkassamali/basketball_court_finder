from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()


class User(db.Model):
    """Model for Users."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    username = db.Column(db.String(length=30), nullable=False, unique=True)

    password = db.Column(db.Text, nullable=False)

    email = db.Column(db.String(length=75), nullable=False, unique=True)

    first_name = db.Column(db.String(length=30), nullable=False)

    last_name = db.Column(db.String(length=30), nullable=False)

    bio = db.Column(db.Text, nullable=True)

    location = db.Column(db.Text, nullable=True)

    courts = db.relationship("Court", backref="user", cascade="all, delete-orphan")


class Court(db.Model):
    """Model for basketball courts."""

    __tablename__ = "courts"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    court_name = db.Column(db.Text, nullable=False)

    google_maps_place_id = db.Column(db.Text, nullable=False)

    address = db.Column(db.Text, nullable=False)

    google_maps_url = db.Column(db.Text, nullable=False)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    user_rating = db.Column(db.Float, db.CheckConstraint('user_rating >= 0 AND user_rating <= 5'), nullable=True)


# When working in ipython, running seed file, or when using unittest framework use this connect_db function otherwise use the one below:
# def connect_db(app):
#     db.app = app
#     db.init_app(app)


def connect_db(app):
    with app.app_context():
        db.app = app
        db.init_app(app)
        db.create_all()
