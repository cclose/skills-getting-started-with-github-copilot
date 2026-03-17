import pytest
from fastapi.testclient import TestClient
from src.app import app, activities
import copy

@pytest.fixture
def client():
    # Arrange: Deep copy the activities to restore after each test
    original_activities = copy.deepcopy(activities)
    with TestClient(app) as c:
        yield c
    # Assert: Restore activities DB to original state
    activities.clear()
    activities.update(copy.deepcopy(original_activities))
