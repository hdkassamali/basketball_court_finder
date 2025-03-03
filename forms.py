from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, TextAreaField, EmailField
from wtforms.validators import InputRequired, Email, Optional, Length

class RegisterForm(FlaskForm):
    """New user registration form."""

    username = StringField("Username", validators=[InputRequired("Username cannot be blank"), Length(min=6, max=30)])
    password = PasswordField("Password", validators=[InputRequired("Password cannot be blank"), Length(min=8)])
    email = EmailField("Email Address", validators=[InputRequired("Email cannot be blank"), Email(), Length(max=75)])
    first_name = StringField("First Name", validators=[InputRequired("First Name cannot be blank"), Length(max=30)])
    last_name = StringField("Last Name", validators=[InputRequired("Last Name cannot be blank"), Length(max=30)])
    bio = TextAreaField("About Me (Optional)", validators=[Optional()])
    location = StringField("Location (Optional)", validators=[Optional()])

class LoginForm(FlaskForm):
    """User login form."""

    username = StringField("Username", validators=[InputRequired()])
    password = PasswordField("Password", validators=[InputRequired()])

class EditForm(FlaskForm):
    """User edit profile form."""

    username = StringField("Username", validators=[InputRequired("Username cannot be blank"), Length(min=6, max=30)])
    email = EmailField("Email Address", validators=[InputRequired("Email cannot be blank"), Email(), Length(max=75)])
    first_name = StringField("First Name", validators=[InputRequired("First Name cannot be blank"), Length(max=30)])
    last_name = StringField("Last Name", validators=[InputRequired("Last Name cannot be blank"), Length(max=30)])
    bio = TextAreaField("About Me (Optional)", validators=[Optional()])
    location = StringField("Location (Optional)", validators=[Optional()])
