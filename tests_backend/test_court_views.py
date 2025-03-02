import pytest
from app import app
from models import db, User, Court


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


def login_test_user(client, user):
    with client.session_transaction() as sess:
        sess["curr_user"] = user.id


def test_save_court(client):
    user = User.register(
        username="courtuser",
        password="password",
        email="court@example.com",
        first_name="Court",
        last_name="User",
        bio="",
        location="Court City",
    )
    db.session.add(user)
    db.session.commit()
    login_test_user(client, user)

    data = {
        "court_name": "Test Court",
        "google_maps_place_id": "testplace123",
        "address": "123 Court Ave",
        "google_maps_url": "https://maps.google.com/?q=123+Court+Ave",
    }
    response = client.post("/save_court", json=data)
    assert response.status_code == 201
    json_data = response.get_json()
    assert "message" in json_data
    assert json_data["message"] == "Court saved successfully"


def test_remove_court(client):
    user = User.register(
        username="removecourt",
        password="password",
        email="remove@example.com",
        first_name="Remove",
        last_name="Court",
        bio="",
        location="Remove City",
    )
    db.session.add(user)
    db.session.commit()
    login_test_user(client, user)

    court = Court(
        court_name="Remove Court",
        google_maps_place_id="remove123",
        address="123 Remove Ave",
        google_maps_url="https://maps.google.com/?q=123+Remove+Ave",
        user_id=user.id,
    )
    db.session.add(court)
    db.session.commit()

    data = {"court_id": court.id}
    response = client.post("/remove_court", json=data)
    assert response.status_code == 200
    json_data = response.get_json()
    assert "message" in json_data
    assert json_data["message"] == "Court successfully deleted"
    assert Court.query.get(court.id) is None


def test_update_court_rating(client):
    user = User.register(
        username="ratecourt",
        password="password",
        email="rate@example.com",
        first_name="Rate",
        last_name="Court",
        bio="",
        location="Rate City",
    )
    db.session.add(user)
    db.session.commit()
    login_test_user(client, user)

    court = Court(
        court_name="Rate Court",
        google_maps_place_id="rate123",
        address="123 Rate Ave",
        google_maps_url="https://maps.google.com/?q=123+Rate+Ave",
        user_id=user.id,
    )
    db.session.add(court)
    db.session.commit()

    data = {"court_id": court.id, "rating": 4}
    response = client.post("/update_court_rating", json=data)
    assert response.status_code == 200
    json_data = response.get_json()
    assert "message" in json_data
    assert json_data["message"] == "Rating updated successfully"
    updated_court = Court.query.get(court.id)
    assert updated_court.user_rating == 4

def test_search_for_courts(client):
    user = User.register(
        username="searchcourt",
        password="password",
        email="search@example.com",
        first_name="Search",
        last_name="Court",
        bio="",
        location="Search City",
    )
    db.session.add(user)
    db.session.commit()

    court1 = Court(
        court_name="First Court",
        google_maps_place_id="first123",
        address="111 First St",
        google_maps_url="https://maps.google.com/?q=111+First+St",
        user_id=user.id,
    )
    court2 = Court(
        court_name="Second Court",
        google_maps_place_id="second123",
        address="222 Second St",
        google_maps_url="https://maps.google.com/?q=222+Second+St",
        user_id=user.id,
    )
    db.session.add_all([court1, court2])
    db.session.commit()

    login_test_user(client, user)
    response = client.get("/search")
    assert response.status_code == 200
    assert b"First Court" in response.data
    assert b"Second Court" in response.data
