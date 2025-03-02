import pytest
from app import app
from models import db, User


@pytest.fixture(autouse=True)
def session_scope():
    """
    Provides an isolated database session per test.

    Opens a connection and begins a transaction, assigns a scoped session to 'db.session',
    and rolls back and cleans up after the test.
    """
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()
        options = dict(bind=connection, binds={})
        session = db._make_scoped_session(options=options)
        db.session = session

        yield session

        transaction.rollback()
        connection.close()
        session.remove()


@pytest.fixture()
def test_app():
    """
    Configures the Flask app for testing with a clean test database and allows to test form data without a CSRF token.

    Sets the test database URI and testing mode, drops and recreates all tables,
    and cleans up the session and engine after tests.
    """
    app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql:///basketball_court_finder_test"
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    with app.app_context():
        db.drop_all()
        db.create_all()
    yield app
    with app.app_context():
        db.session.remove()
        db.engine.dispose()


@pytest.fixture
def client(test_app):
    """
    Returns a test client for the Flask app.

    Allows simulated HTTP requests to be made without running a live server.
    """
    return test_app.test_client()


def test_register_get(client):
    response = client.get("/register")
    assert response.status_code == 200
    assert b"Register" in response.data


def test_register_post(client):
    response = client.post(
        "/register",
        data={
            "username": "testregister",
            "password": "password",
            "email": "register@example.com",
            "first_name": "Test",
            "last_name": "Register",
            "bio": "Test bio",
            "location": "Test City",
        },
        follow_redirects=True,
    )
    assert response.status_code == 200
    assert b"Welcome" in response.data or b"Court Connect" in response.data
    user = User.query.filter_by(username="testregister").first()
    assert user is not None


def test_login_post(client):
    user = User.register(
        username="loginuser",
        password="password",
        email="login@example.com",
        first_name="Login",
        last_name="User",
        bio="",
        location="Loginville",
    )
    db.session.add(user)
    db.session.commit()

    response = client.post(
        "/login",
        data={"username": "loginuser", "password": "password"},
        follow_redirects=True,
    )
    assert response.status_code == 200
    assert b"Welcome back" in response.data


def test_login_invalid(client):
    response = client.post(
        "/login",
        data={"username": "nousername", "password": "wrongpassword"},
        follow_redirects=True,
    )
    assert response.status_code == 200
    assert b"Invalid username/password" in response.data

def test_logout(client):
    user = User.register(
        username="logoutuser",
        password="password",
        email="logout@example.com",
        first_name="Logout",
        last_name="User",
        bio="",
        location="Logout City",
    )
    db.session.add(user)
    db.session.commit()

    with client.session_transaction() as sess:
        sess["curr_user"] = user.id
    
    response = client.get("/logout", follow_redirects=True)
    assert response.status_code == 200
    assert b"login" in response.data.lower()

def test_user_profile_view(client):
    user = User.register(
        username="profileuser",
        password="password",
        email="profile@example.com",
        first_name="Profile",
        last_name="User",
        bio="My bio",
        location="Profile City",
    )
    db.session.add(user)
    db.session.commit()

    with client.session_transaction() as sess:
        sess["curr_user"] = user.id

    response = client.get(f"/users/{user.username}/user_profile")
    assert response.status_code == 200
    assert bytes(user.username, "utf-8") in response.data
