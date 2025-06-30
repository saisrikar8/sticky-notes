import { getPendingShareRequests, respondToShareRequest as apiRespondToShareRequest } from './api.js';

function getGroupsFromDatabaseAndUpdateUI() {
  // start fetch event to get groups the user is in
  fetch("/api/get-joined-groups", {
    method: "GET",
    credentials: "include"
  }).then((response) => response.json())
    .then((data) => {
      console.log("Groups:", data);
      renderGroups(data);
    })
    .catch((error) => {
      console.error("Error fetching groups:", error);
    });

  // Also fetch pending share requests
  fetchPendingShareRequests();
}

async function fetchPendingShareRequests() {
  try {
    const data = await getPendingShareRequests();
    console.log("Pending share requests:", data);
    renderShareRequests(data);
  } catch (error) {
    console.error("Error fetching pending share requests:", error);
  }
}

function renderShareRequests(requests) {
  const container = document.getElementById('notificationsContainer');
  const badge = document.getElementById('notificationBadge');
  const noNotificationsMessage = document.getElementById('noNotificationsMessage');

  // Clear previous notifications except the "no notifications" message
  Array.from(container.children).forEach(child => {
    if (child.id !== 'noNotificationsMessage') {
      container.removeChild(child);
    }
  });

  if (requests.length === 0) {
    noNotificationsMessage.classList.remove('hidden');
    badge.classList.add('hidden');
    return;
  }

  // Hide the "no notifications" message and show the badge
  noNotificationsMessage.classList.add('hidden');
  badge.classList.remove('hidden');
  badge.textContent = requests.length;

  // Add each request to the container
  requests.forEach(request => {
    const requestElement = document.createElement('div');
    requestElement.className = 'p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors';

    requestElement.innerHTML = `
      <div class="mb-2">
        <p class="text-sm text-gray-600">
          <span class="font-semibold">${request.senderEmail}</span> has invited you to join:
        </p>
        <p class="font-medium text-gray-800">${request.groupName}</p>
      </div>
      <div class="flex gap-2 mt-3">
        <button 
          class="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
          onclick="respondToShareRequest('${request._id}', true)">
          Accept
        </button>
        <button 
          class="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
          onclick="respondToShareRequest('${request._id}', false)">
          Decline
        </button>
      </div>
    `;

    container.appendChild(requestElement);
  });
}

async function respondToShareRequest(requestId, accept) {
  try {
    const data = await apiRespondToShareRequest(requestId, accept);
    console.log("Response to share request:", data);

    // Show a notification
    const message = accept ? "You have accepted the invitation" : "You have declined the invitation";
    showNotification(message);

    // Refresh the groups and pending requests
    getGroupsFromDatabaseAndUpdateUI();
  } catch (error) {
    console.error("Error responding to share request:", error);
    showNotification("Error: " + error.message, true);
  }
}

// Make respondToShareRequest available globally
window.respondToShareRequest = respondToShareRequest;

function showNotification(message, isError = false) {
  const notification = document.createElement('div');
  notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${isError ? 'bg-red-500' : 'bg-green-500'} text-white max-w-xs z-50 transform transition-all duration-300 translate-y-0 opacity-100`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Animate out after 3 seconds
  setTimeout(() => {
    notification.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

function toggleNotifications() {
  const dropdown = document.getElementById('notificationDropdown');
  dropdown.classList.toggle('hidden');

  // Close dropdown when clicking outside
  if (!dropdown.classList.contains('hidden')) {
    const closeDropdown = (e) => {
      if (!dropdown.contains(e.target) && e.target.id !== 'notificationBtn') {
        dropdown.classList.add('hidden');
        document.removeEventListener('click', closeDropdown);
      }
    };

    // Use setTimeout to avoid immediate triggering
    setTimeout(() => {
      document.addEventListener('click', closeDropdown);
    }, 0);
  }
}

// Make toggleNotifications available globally
window.toggleNotifications = toggleNotifications;


function renderGroups(groups) {
  const container = document.getElementById('groupsContainer');
  container.innerHTML = '';

  groups.forEach(group => {
    const groupCard = document.createElement('div');
    groupCard.className = 'group-card bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden cursor-pointer min-w-[280px]';

    groupCard.innerHTML = `
      <div class="relative">
        <img
          src="/scenes/${group.image}.png"
          alt="${group.name}"
          class="group-image w-full h-48 object-cover transition-transform duration-300"
        />
        <div class="overlay absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300"></div>
      </div>
      <div class="p-6">
        <h3 class="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
          ${group.name}
        </h3>
      </div>
    `;

    // Add onclick handler
    groupCard.onclick = () => handleGroupClick(group.id);

    container.appendChild(groupCard);
  });
}


function handleGroupClick(groupId) {
  console.log("Group clicked:", groupId);
  window.location.href = "/scene/" + groupId;
}


function joinGroup() {
  console.log("joining group");
}

async function openCreateModal() {
  // fetch the scenes 
  fetch("/api/get-avaliable-scenes").then(async (response) => {
    const scenes = await response.json();
    console.log(scenes);
    const selectElement = document.getElementById('sceneSelection');
    selectElement.innerHTML = '<option value="">Select a scene</option>';

    scenes.forEach(scene => {
      const option = document.createElement('option');
      option.value = scene;
      option.textContent = scene;
      selectElement.appendChild(option);
    });
  });

  document.getElementById('createModal').classList.remove('hidden');
  document.getElementById('newGroupName').focus();
}

function closeCreateModal() {
  document.getElementById('createModal').classList.add('hidden');
  document.getElementById('newGroupName').value = '';
}

function createGroup() {
  const groupNameInput = document.getElementById('newGroupName');
  const groupName = groupNameInput.value.trim();
  const selectedScene = document.getElementById('sceneSelection').value;

  if (groupName && selectedScene !== "") {
    console.log("creating a new group for you");
    fetch("/api/create-group", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ name: groupName, image: selectedScene })
    }).then((response) => {
      getGroupsFromDatabaseAndUpdateUI();
    })
    closeCreateModal();
  }
}

function handleEnterKey(event) {
  if (event.key === 'Enter') {
    createGroup();
  }
}

// Replace the stub functions with the real functions
// This ensures that the functions are available globally for HTML onclick attributes
window.openCreateModal = openCreateModal;
window.closeCreateModal = closeCreateModal;
window.createGroup = createGroup;
window.handleEnterKey = handleEnterKey;
window.toggleNotifications = toggleNotifications;
window.respondToShareRequest = respondToShareRequest;

// Log to verify that the functions are replaced
console.log("Global functions replaced with real implementations");

getGroupsFromDatabaseAndUpdateUI();
