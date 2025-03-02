import pytest
from sqlalchemy.exc import IntegrityError
from app import app
from models import db, Court, User



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


def test_court_model_create(client):
    user = User.register(
        username="testuser",
        password="password",
        email="test@example.com",
        first_name="Test",
        last_name="User",
        bio="Bio",
        location="Testville",
    )
    db.session.add(user)
    db.session.commit()

    court = Court(
        court_name="Test Court",
        google_maps_place_id="testplace123",
        address="123 Test Ave",
        google_maps_url="https://maps.google.com/?q=123+Test+Ave",
        user_id=user.id,
        user_rating=4,
    )
    db.session.add(court)
    db.session.commit()

    assert court.id is not None
    serialized = court.serialize()
    assert serialized["court_name"] == "Test Court"
    assert serialized["user_rating"] == 4


def test_court_model_rating_constraint(client):
    # Need to create a user to associate with the court
    user = User.register(
        username="ratinguser",
        password="password",
        email="rating@example.com",
        first_name="Rating",
        last_name="User",
        bio="",
        location="Test Town",
    )
    db.session.add(user)
    db.session.commit()

    # To test failing constraint, need to create a court with an invalid rating (6).
    court = Court(
        court_name="Invalid Rating Court",
        google_maps_place_id="invalid123",
        address="123 Invalid Rd",
        google_maps_url="https://maps.google.com/?q=123+Invalid+Rd",
        user_id=user.id,
        user_rating=6,
    )
    db.session.add(court)

    with pytest.raises(IntegrityError):
        db.session.commit()
    db.session.rollback()
