document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML (ADA: use <ul> with aria-label)
        let participantsHTML = '';
        if (details.participants && details.participants.length > 0) {
          participantsHTML = `
            <div class="participants-section">
              <h5 id="participants-label-${name}" class="participants-title">Participants</h5>
              <ul class="participants-list" aria-labelledby="participants-label-${name}">
                ${details.participants.map(
                  (email) => `<li class="participant-item"><span class="lion-emoji" aria-hidden="true">🦁</span> <span class="participant-email">${email}</span></li>`
                ).join('')}
              </ul>
            </div>
          `;
            participantsHTML = `
              <div class="participants-section">
                <h5 id="participants-label-${name}" class="participants-title">Participants</h5>
                <ul class="participants-list lion-bullets" aria-labelledby="participants-label-${name}">
                  ${details.participants.map(
                    (email) => `
                      <li class="participant-item">
                        <span class="lion-emoji" aria-hidden="true">🦁</span>
                        <span class="participant-email">${email}</span>
                        <button class="delete-participant-btn" title="Remove participant" aria-label="Remove ${email} from ${name}" data-activity="${name}" data-email="${email}">
                          <span aria-hidden="true">✖️</span>
                        </button>
                      </li>
                    `
                  ).join('')}
                </ul>
              </div>
            `;
        } else {
          participantsHTML = `
            <div class="participants-section">
              <h5 id="participants-label-${name}" class="participants-title">Participants</h5>
              <p class="no-participants" aria-live="polite">No participants yet.</p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

          // Add delete event listeners for participants
          setTimeout(() => {
            const deleteBtns = activityCard.querySelectorAll('.delete-participant-btn');
            deleteBtns.forEach(btn => {
              btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const activity = btn.getAttribute('data-activity');
                const email = btn.getAttribute('data-email');
                try {
                  const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
                    method: 'DELETE',
                  });
                  const result = await response.json();
                  if (response.ok) {
                    messageDiv.textContent = result.message || 'Participant removed.';
                    messageDiv.className = 'success';
                    fetchActivities();
                  } else {
                    messageDiv.textContent = result.detail || 'Failed to remove participant.';
                    messageDiv.className = 'error';
                  }
                  messageDiv.classList.remove('hidden');
                  setTimeout(() => { messageDiv.classList.add('hidden'); }, 5000);
                } catch (error) {
                  messageDiv.textContent = 'Error removing participant.';
                  messageDiv.className = 'error';
                  messageDiv.classList.remove('hidden');
                }
              });
            });
          }, 0);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
