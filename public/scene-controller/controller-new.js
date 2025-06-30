// controller-new.js
import { updateStickyPosition, getStickies, updateStickyText, postSticky, removeSticky, sendShareRequest, getGroupDetails } from './api.js';

class StickyNotesManager {
  constructor() {
    this.notes = [];
    this.nextId = 1;
    this.workspace = document.getElementById('workspace');
    this.selectedNote = null;
    this.zoomLevel = 1;

    this.backgroundWidth = 1920;
    this.backgroundHeight = 1080;

    this.init();
    this.updateWorkspaceScale();
    window.addEventListener('resize', () => this.updateWorkspaceScale());
  }

  async init() {
    document.getElementById('addNoteBtn').addEventListener('click', () => this.addNote());
    document.getElementById('addPersonBtn').addEventListener('click', () => this.addPerson());

    document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.2));
    document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.8));
    document.getElementById('zoomReset').addEventListener('click', () => this.resetZoom());

    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        if (this.selectedNote) {
          const color = option.dataset.color;
          this.selectedNote.changeColor(color);
          this.selectedNote.element.querySelector('.color-picker').value = color;
        }
      });
    });

    try {
      // Get group details to set the background image
      const groupDetails = await getGroupDetails();
      if (groupDetails && groupDetails.image) {
        // Set the background image of the workspace
        const workspace = document.getElementById('workspace');
        workspace.style.backgroundImage = `url('/scenes/${groupDetails.image}.png')`;
      }

      // Load stickies from server
      const stickies = await getStickies(window.location.pathname.split('/').pop());
      if (stickies && Array.isArray(stickies)) {
        stickies.forEach(sticky => {
          // Create note with server data
          const note = new DraggableSticky(this, sticky._id, sticky.x || 50, sticky.y || 50, sticky);
          this.notes.push(note);
          if (sticky._id >= this.nextId) this.nextId = sticky._id + 1;
        });
      }
    } catch (error) {
      console.error('Error loading stickies or group details:', error);
      // Redirect to login if unauthorized
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        window.location.href = '/login';
        return;
      }
    }

    this.updateWorkspaceScale();
    this.updatePositionDisplay();
  }

  async addPerson() {
    try {
      // Create a modal for the invitation
      const modal = document.createElement('div');
      modal.className = 'invite-modal';
      modal.innerHTML = `
        <div class="invite-modal-content">
          <div class="invite-modal-header">
            <h2>Invite Someone to this Group</h2>
            <span class="invite-modal-close">&times;</span>
          </div>
          <div class="invite-modal-body">
            <p>Enter the email address of the person you want to invite to this group.</p>
            <p>They will receive a request to join and can accept or decline.</p>
            <input type="email" id="invite-email" placeholder="Email address" class="invite-email-input">
          </div>
          <div class="invite-modal-footer">
            <button id="invite-cancel-btn" class="invite-btn invite-cancel-btn">Cancel</button>
            <button id="invite-send-btn" class="invite-btn invite-send-btn">Send Invitation</button>
          </div>
        </div>
      `;

      // Add styles for the modal
      const style = document.createElement('style');
      style.textContent = `
        .invite-modal {
          display: block;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.5);
        }
        .invite-modal-content {
          background-color: #fff;
          margin: 15% auto;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          width: 400px;
          max-width: 80%;
        }
        .invite-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .invite-modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #333;
        }
        .invite-modal-close {
          font-size: 1.5rem;
          cursor: pointer;
          color: #888;
        }
        .invite-modal-close:hover {
          color: #333;
        }
        .invite-modal-body {
          margin-bottom: 20px;
        }
        .invite-email-input {
          width: 100%;
          padding: 10px;
          margin-top: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        .invite-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .invite-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }
        .invite-cancel-btn {
          background-color: #f1f1f1;
          color: #333;
        }
        .invite-send-btn {
          background-color: #4CAF50;
          color: white;
        }
        .invite-send-btn:hover {
          background-color: #45a049;
        }
        .invite-cancel-btn:hover {
          background-color: #e1e1e1;
        }
      `;

      document.head.appendChild(style);
      document.body.appendChild(modal);

      // Focus the email input
      const emailInput = document.getElementById('invite-email');
      emailInput.focus();

      // Return a promise that resolves when the user submits the form or cancels
      return new Promise((resolve, reject) => {
        const closeModal = () => {
          document.body.removeChild(modal);
          resolve(null);
        };

        // Close button handler
        const closeBtn = modal.querySelector('.invite-modal-close');
        closeBtn.addEventListener('click', closeModal);

        // Cancel button handler
        const cancelBtn = document.getElementById('invite-cancel-btn');
        cancelBtn.addEventListener('click', closeModal);

        // Send button handler
        const sendBtn = document.getElementById('invite-send-btn');
        sendBtn.addEventListener('click', async () => {
          const email = emailInput.value.trim();

          if (!email) {
            alert('Please enter an email address.');
            return;
          }

          try {
            // Get current group ID from URL
            const pathParts = window.location.pathname.split('/');
            const groupId = pathParts[pathParts.length - 1];

            // Send the share request
            const result = await sendShareRequest(email, groupId);

            // Show success message
            const successModal = document.createElement('div');
            successModal.className = 'invite-modal';
            successModal.innerHTML = `
              <div class="invite-modal-content">
                <div class="invite-modal-header">
                  <h2>Invitation Sent</h2>
                  <span class="invite-modal-close">&times;</span>
                </div>
                <div class="invite-modal-body">
                  <p>Your invitation has been sent to ${email}.</p>
                  <p>They will receive a notification to accept or decline your invitation.</p>
                </div>
                <div class="invite-modal-footer">
                  <button id="success-ok-btn" class="invite-btn invite-send-btn">OK</button>
                </div>
              </div>
            `;

            document.body.removeChild(modal);
            document.body.appendChild(successModal);

            const okBtn = document.getElementById('success-ok-btn');
            const successCloseBtn = successModal.querySelector('.invite-modal-close');

            const closeSuccessModal = () => {
              document.body.removeChild(successModal);
              resolve(result);
            };

            okBtn.addEventListener('click', closeSuccessModal);
            successCloseBtn.addEventListener('click', closeSuccessModal);

          } catch (error) {
            console.error('Error sending share request:', error);

            // Show error message
            const errorModal = document.createElement('div');
            errorModal.className = 'invite-modal';
            errorModal.innerHTML = `
              <div class="invite-modal-content">
                <div class="invite-modal-header">
                  <h2>Error</h2>
                  <span class="invite-modal-close">&times;</span>
                </div>
                <div class="invite-modal-body">
                  <p>Failed to send invitation: ${error.message}</p>
                </div>
                <div class="invite-modal-footer">
                  <button id="error-ok-btn" class="invite-btn invite-send-btn">OK</button>
                </div>
              </div>
            `;

            document.body.removeChild(modal);
            document.body.appendChild(errorModal);

            const okBtn = document.getElementById('error-ok-btn');
            const errorCloseBtn = errorModal.querySelector('.invite-modal-close');

            const closeErrorModal = () => {
              document.body.removeChild(errorModal);
              reject(error);
            };

            okBtn.addEventListener('click', closeErrorModal);
            errorCloseBtn.addEventListener('click', closeErrorModal);
          }
        });
      });
    } catch (error) {
      console.error('Error in addPerson:', error);
      throw error;
    }
  }

  updateWorkspaceScale() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const scaleX = viewportWidth / this.backgroundWidth;
    const scaleY = viewportHeight / this.backgroundHeight;
    this.backgroundScale = Math.min(scaleX, scaleY);

    this.displayedBackgroundWidth = this.backgroundWidth * this.backgroundScale;
    this.displayedBackgroundHeight = this.backgroundHeight * this.backgroundScale;

    this.backgroundOffsetX = (viewportWidth - this.displayedBackgroundWidth) / 2;
    this.backgroundOffsetY = (viewportHeight - this.displayedBackgroundHeight) / 2;

    this.notes.forEach(note => note.updateAbsolutePosition());
  }

  async addNote(relativeX = 50, relativeY = 50) {
    try {
      // Get current group ID from URL
      const pathParts = window.location.pathname.split('/');
      const groupId = pathParts[pathParts.length - 1];

      // Post new sticky to server first
      const savedSticky = await postSticky({
        title: 'New Note',
        text: '',
        color: '#ffeb3b',
        x: relativeX,
        y: relativeY,
        groupId: groupId
      });

      const note = new DraggableSticky(this, savedSticky._id || savedSticky.id, relativeX, relativeY, {
        title: 'New Note',
        text: '',
        color: '#ffeb3b',
        x: relativeX,
        y: relativeY
      });
      this.notes.push(note);
      this.updatePositionDisplay();
    } catch (error) {
      console.error('Error adding note:', error);
    }
  }

  async removeNote(note) {
    try {
      await removeSticky(note.id);
      const index = this.notes.indexOf(note);
      if (index > -1) {
        this.notes.splice(index, 1);
        note.element.remove();
        this.updatePositionDisplay();
        if (this.selectedNote === note) this.selectedNote = null;
      }
    } catch (error) {
      console.error('Error removing note:', error);
    }
  }

  selectNote(note) {
    if (this.selectedNote) {
      this.selectedNote.element.style.border = 'none';
    }
    this.selectedNote = note;
    note.element.style.border = '2px solid #2196f3';
  }

  zoom(factor) {
    this.zoomLevel *= factor;
    this.zoomLevel = Math.max(0.3, Math.min(3, this.zoomLevel));
    this.workspace.style.transform = `scale(${this.zoomLevel})`;
    this.workspace.style.transformOrigin = '0 0';
  }

  resetZoom() {
    this.zoomLevel = 1;
    this.workspace.style.transform = 'scale(1)';
  }

  updatePositionDisplay() {
    const display = document.getElementById('positionDisplay');
    if (this.notes.length === 0) {
      display.textContent = 'Notes: 0 | Click "Add New Note" to start';
    } else if (this.selectedNote) {
      const note = this.selectedNote;
      display.textContent = `Selected Note #${note.id} | Relative: X: ${note.relativePosition.x.toFixed(1)}%, Y: ${note.relativePosition.y.toFixed(1)}% | Total Notes: ${this.notes.length}`;
    } else {
      display.textContent = `Total Notes: ${this.notes.length} | Click a note to see its position`;
    }
  }

  absoluteToRelative(x, y) {
    const relativeX = ((x - this.backgroundOffsetX) / this.displayedBackgroundWidth) * 100;
    const relativeY = ((y - this.backgroundOffsetY) / this.displayedBackgroundHeight) * 100;
    return { x: Math.max(0, Math.min(100, relativeX)), y: Math.max(0, Math.min(100, relativeY)) };
  }

  relativeToAbsolute(relativeX, relativeY) {
    const x = this.backgroundOffsetX + (relativeX / 100) * this.displayedBackgroundWidth;
    const y = this.backgroundOffsetY + (relativeY / 100) * this.displayedBackgroundHeight;
    return { x, y };
  }
}

class DraggableSticky {
  constructor(manager, id, relativeX = 50, relativeY = 50, sticky = null) {
    this.manager = manager;
    this.id = id;
    this.isDragging = false;
    this.offset = { x: 0, y: 0 };
    this.isCollapsed = true; // Start collapsed by default
    this.debouncedUpdate = null;
    this.debouncedPositionUpdate = null;

    this.relativePosition = { x: relativeX, y: relativeY };

    if (sticky) {
      this.createElement(sticky.title || 'New Note', sticky.text || '', sticky.color || '#ffeb3b');
    } else {
      this.createElement();
    }

    this.updateAbsolutePosition();
    this.init();
  }

  createElement(title = "New Note", content = "", color = "#ffeb3b") {
    this.element = document.createElement('div');
    this.element.className = 'sticky-note';
    if (this.isCollapsed) {
      this.element.classList.add('collapsed');
    }
    this.element.style.backgroundColor = color;
    this.element.innerHTML = `
      <div class="sticky-header">
        <input type="text" class="sticky-title" value="${title}" placeholder="Enter title...">
        <div class="header-controls">
          <input type="color" class="color-picker" value="${color}">
          <button class="control-btn collapse-btn" title="Expand">+</button>
          <button class="control-btn delete-btn" title="Delete">×</button>
        </div>
      </div>
      <div class="sticky-content">
        <textarea class="content-textarea" placeholder="Write your note here...">${content}</textarea>
      </div>`;

    this.manager.workspace.appendChild(this.element);
  }

  updateAbsolutePosition() {
    const absolute = this.manager.relativeToAbsolute(this.relativePosition.x, this.relativePosition.y);
    this.absolutePosition = absolute;
    this.element.style.left = this.absolutePosition.x + 'px';
    this.element.style.top = this.absolutePosition.y + 'px';
  }

  init() {
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // Add double-click event listener to toggle between collapsed and expanded views
    this.element.addEventListener('dblclick', e => {
      e.stopPropagation();
      this.toggleCollapse();
    });

    const titleInput = this.element.querySelector('.sticky-title');
    const contentTextarea = this.element.querySelector('.content-textarea');

    titleInput.addEventListener('input', () => this.scheduleTextUpdate());
    contentTextarea.addEventListener('input', () => this.scheduleTextUpdate());

    const colorPicker = this.element.querySelector('.color-picker');
    colorPicker.addEventListener('change', this.handleColorChange.bind(this));

    const collapseBtn = this.element.querySelector('.collapse-btn');
    const deleteBtn = this.element.querySelector('.delete-btn');

    collapseBtn.addEventListener('click', e => {
      e.stopPropagation();
      this.toggleCollapse();
    });

    deleteBtn.addEventListener('click', e => {
      e.stopPropagation();
      this.manager.removeNote(this);
    });

    const inputs = this.element.querySelectorAll('input, textarea, button');
    inputs.forEach(input => {
      input.addEventListener('mousedown', e => e.stopPropagation());
    });

    this.element.addEventListener('click', () => {
      this.manager.selectNote(this);
      this.manager.updatePositionDisplay();
    });
  }

  scheduleTextUpdate() {
    clearTimeout(this.debouncedUpdate);
    this.debouncedUpdate = setTimeout(async () => {
      try {
        const title = this.element.querySelector('.sticky-title').value;
        const content = this.element.querySelector('.content-textarea').value;
        await updateStickyText(this.id, title, content);
      } catch (error) {
        console.error('Error updating sticky text:', error);
      }
    }, 500);
  }

  schedulePositionUpdate() {
    clearTimeout(this.debouncedPositionUpdate);
    this.debouncedPositionUpdate = setTimeout(async () => {
      try {
        await updateStickyPosition(this.id, this.relativePosition.x, this.relativePosition.y);
      } catch (error) {
        console.error('Error updating sticky position:', error);
      }
    }, 100);
  }

  handleMouseDown(e) {
    if (e.target.matches('input, textarea, button')) return;
    this.isDragging = true;
    this.element.classList.add('dragging');
    this.manager.selectNote(this);

    const rect = this.element.getBoundingClientRect();
    const scale = this.manager.zoomLevel;
    this.offset.x = (e.clientX - rect.left) / scale;
    this.offset.y = (e.clientY - rect.top) / scale;

    e.preventDefault();
  }

  handleMouseMove(e) {
    if (!this.isDragging) return;

    const scale = this.manager.zoomLevel;
    const newX = (e.clientX / scale) - this.offset.x;
    const newY = (e.clientY / scale) - this.offset.y;

    this.absolutePosition = {
      x: Math.max(0, Math.min(window.innerWidth - this.element.offsetWidth, newX)),
      y: Math.max(0, Math.min(window.innerHeight - this.element.offsetHeight, newY))
    };

    this.relativePosition = this.manager.absoluteToRelative(this.absolutePosition.x, this.absolutePosition.y);

    this.element.style.left = this.absolutePosition.x + 'px';
    this.element.style.top = this.absolutePosition.y + 'px';

    // Schedule position update to server
    this.schedulePositionUpdate();

    this.manager.updatePositionDisplay();
  }

  handleMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.element.classList.remove('dragging');
    }
  }

  handleColorChange(e) {
    this.changeColor(e.target.value);
  }

  changeColor(color) {
    this.element.style.backgroundColor = color;
  }

  toggleCollapse() {
    // Store the current position before toggling
    const currentPosition = {
      x: this.absolutePosition.x,
      y: this.absolutePosition.y
    };

    // Toggle collapsed state
    this.isCollapsed = !this.isCollapsed;
    this.element.classList.toggle('collapsed');

    // Update button text and title
    const collapseBtn = this.element.querySelector('.collapse-btn');
    collapseBtn.textContent = this.isCollapsed ? '+' : '−';
    collapseBtn.title = this.isCollapsed ? 'Expand' : 'Collapse';

    // After toggling, ensure the position is maintained
    // We need to wait for the DOM to update with the new size
    setTimeout(() => {
      // Calculate any position adjustments needed to keep the note centered
      if (this.isCollapsed) {
        // When collapsing, center the small square on the previous position
        const width = 50; // Width of collapsed note
        const height = 50; // Height of collapsed note
        const offsetX = (this.element.offsetWidth - width) / 2;
        const offsetY = (this.element.offsetHeight - height) / 2;

        this.absolutePosition = {
          x: currentPosition.x + offsetX,
          y: currentPosition.y + offsetY
        };
      } else {
        // When expanding, adjust position to keep the center point the same
        const width = this.element.offsetWidth;
        const height = this.element.offsetHeight;
        const offsetX = (width - 50) / 2; // 50 is the width of collapsed note
        const offsetY = (height - 50) / 2; // 50 is the height of collapsed note

        this.absolutePosition = {
          x: currentPosition.x - offsetX,
          y: currentPosition.y - offsetY
        };
      }

      // Update the element position
      this.element.style.left = this.absolutePosition.x + 'px';
      this.element.style.top = this.absolutePosition.y + 'px';

      // Update relative position
      this.relativePosition = this.manager.absoluteToRelative(this.absolutePosition.x, this.absolutePosition.y);

      // Schedule position update to server
      this.schedulePositionUpdate();
    }, 10);
  }
}

// Initialize the app
let notesManager;

window.addEventListener('DOMContentLoaded', () => {
  notesManager = new StickyNotesManager();
});

window.addEventListener('resize', () => {
  if (notesManager) {
    notesManager.updateWorkspaceScale();
    notesManager.updatePositionDisplay();
  }
});
