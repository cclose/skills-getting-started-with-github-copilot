import pytest
import random
import string
from src.app import activities

def random_email():
    user = ''.join(random.choices(string.ascii_lowercase, k=8))
    return f"{user}@mergington.edu"

def get_existing_activity():
    return next(iter(activities.keys()))

def test_get_activities(client):
    # Arrange: (No setup needed)
    # Act
    resp = client.get("/activities")
    # Assert
    assert resp.status_code == 200
    assert isinstance(resp.json(), dict)

def test_signup_positive(client):
    # Arrange
    activity = get_existing_activity()
    email = random_email()
    # Act
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    # Assert
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]

def test_signup_duplicate(client):
    # Arrange
    activity = get_existing_activity()
    email = random_email()
    client.post(f"/activities/{activity}/signup?email={email}")
    # Act
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    # Assert
    assert resp.status_code == 400
    assert "already signed up" in resp.json()["detail"].lower()

def test_signup_invalid_activity(client):
    # Arrange
    email = random_email()
    # Act
    resp = client.post(f"/activities/NotARealActivity/signup?email={email}")
    # Assert
    assert resp.status_code == 404

def test_signup_invalid_email(client):
    # Arrange
    activity = get_existing_activity()
    # Act
    resp = client.post(f"/activities/{activity}/signup?email=notanemail")
    # Assert (should still succeed, as no email validation in backend)
    assert resp.status_code == 200

def test_unregister_positive(client):
    # Arrange
    activity = get_existing_activity()
    email = random_email()
    client.post(f"/activities/{activity}/signup?email={email}")
    # Act
    resp = client.delete(f"/activities/{activity}/unregister?email={email}")
    # Assert
    assert resp.status_code == 200
    assert email not in activities[activity]["participants"]

def test_unregister_not_registered(client):
    # Arrange
    activity = get_existing_activity()
    email = random_email()
    # Act
    resp = client.delete(f"/activities/{activity}/unregister?email={email}")
    # Assert
    assert resp.status_code == 404

def test_unregister_invalid_activity(client):
    # Arrange
    email = random_email()
    # Act
    resp = client.delete(f"/activities/NotARealActivity/unregister?email={email}")
    # Assert
    assert resp.status_code == 404

def test_unregister_invalid_email(client):
    # Arrange
    activity = get_existing_activity()
    # Act
    resp = client.delete(f"/activities/{activity}/unregister?email=notanemail")
    # Assert
    assert resp.status_code == 404

def test_fuzz_signup_and_unregister(client):
    # Arrange
    activity = get_existing_activity()
    url_safe = string.ascii_letters + string.digits + ".-_"  # URL-safe chars
    for _ in range(10):
        email = ''.join(random.choices(url_safe, k=8)) + "@mergington.edu"
        # Act
        resp = client.post(f"/activities/{activity}/signup?email={email}")
        # Assert
        assert resp.status_code in (200, 400)  # Accepts or rejects
        # Act
        resp2 = client.delete(f"/activities/{activity}/unregister?email={email}")
        # Assert
        assert resp2.status_code in (200, 404)
