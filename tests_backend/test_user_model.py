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
    Configures the Flask app for testing with a clean test database.

    Sets the test database URI and testing mode, drops and recreates all tables,
    and cleans up the session and engine after tests.
    """
    app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql:///basketball_court_finder_test"
    app.config["TESTING"] = True
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


def test_user_register(client):
    user = User.register(
        username="newuser",
        password="password",
        email="newuser@example.com",
        first_name="New",
        last_name="User",
        bio="Hello",
        location="Testland",
    )
    db.session.add(user)
    db.session.commit()

    assert user.id is not None
    assert user.password != "password"

def test_user_authenticate_success(client):
    user = User.register(
        username="authuser",
        password="password",
        email="authuser@example.com",
        first_name="Auth",
        last_name="User",
        bio="",
        location="Authland",
    )
    db.session.add(user)
    db.session.commit()

    auth_user = User.authenticate(username="authuser", password="password")
    assert auth_user is not None
    assert auth_user.id == user.id

def test_user_authenticate_failure(client):
    user = User.register(
        username="failuser",
        password="password",
        email="failuser@example.com",
        first_name="Fail",
        last_name="User",
        bio="Hello",
        location="Failtown",
    )
    db.session.add(user)
    db.session.commit()

    auth_user = User.authenticate(username="failuser", password="wrongpassword")
    assert auth_user is False
