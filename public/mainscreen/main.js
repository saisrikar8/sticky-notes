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
}


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

getGroupsFromDatabaseAndUpdateUI();