class StickyNotesManager {
  constructor() {
    this.notes = [];
    this.nextId = 1;
    this.workspace = document.getElementById('workspace');
    this.selectedNote = null;
    this.zoomLevel = 1;

    // Background image dimensions for relative positioning
    this.backgroundWidth = 1920; // Set this to your background image width
    this.backgroundHeight = 1080; // Set this to your background image height

    this.init();
    this.updateWorkspaceScale();
    window.addEventListener('resize', () => this.updateWorkspaceScale());
  }

  init() {
    // Add note button
    document.getElementById('addNoteBtn').addEventListener('click', () => {
      this.addNote();
    });

    // Zoom controls
    document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.2));
    document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.8));
    document.getElementById('zoomReset').addEventListener('click', () => this.resetZoom());

    // Quick color options
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

    // Add initial note
    this.addNote();
  }

  updateWorkspaceScale() {
    // Calculate how the background image scales
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const scaleX = viewportWidth / this.backgroundWidth;
    const scaleY = viewportHeight / this.backgroundHeight;

    // Use contain sizing (fit entire image, may have letterboxing)
    this.backgroundScale = Math.min(scaleX, scaleY);

    // Calculate actual displayed background dimensions
    this.displayedBackgroundWidth = this.backgroundWidth * this.backgroundScale;
    this.displayedBackgroundHeight = this.backgroundHeight * this.backgroundScale;

    // Calculate offset to center the background
    this.backgroundOffsetX = (viewportWidth - this.displayedBackgroundWidth) / 2;
    this.backgroundOffsetY = (viewportHeight - this.displayedBackgroundHeight) / 2;

    // Update all note positions
    this.notes.forEach(note => note.updateAbsolutePosition());

    console.log(`Background scale: ${this.backgroundScale.toFixed(3)}, Display size: ${this.displayedBackgroundWidth.toFixed(0)}x${this.displayedBackgroundHeight.toFixed(0)}`);
  }

  addNote(relativeX = null, relativeY = null) {
    const note = new DraggableSticky(this, this.nextId++, relativeX, relativeY);
    this.notes.push(note);
    this.updatePositionDisplay();
    console.log(`Added note #${note.id} at relative position X: ${note.relativePosition.x.toFixed(2)}%, Y: ${note.relativePosition.y.toFixed(2)}%`);
    return note;
  }

  removeNote(note) {
    const index = this.notes.indexOf(note);
    if (index > -1) {
      this.notes.splice(index, 1);
      note.element.remove();
      this.updatePositionDisplay();
      console.log(`Removed note #${note.id}`);

      if (this.selectedNote === note) {
        this.selectedNote = null;
      }
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
    console.log(`Zoom level: ${(this.zoomLevel * 100).toFixed(0)}%`);
  }

  resetZoom() {
    this.zoomLevel = 1;
    this.workspace.style.transform = 'scale(1)';
    console.log('Zoom reset to 100%');
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

  // Convert absolute pixel position to relative percentage on background image
  absoluteToRelative(x, y) {
    const relativeX = ((x - this.backgroundOffsetX) / this.displayedBackgroundWidth) * 100;
    const relativeY = ((y - this.backgroundOffsetY) / this.displayedBackgroundHeight) * 100;
    return { x: relativeX, y: relativeY };
  }

  // Convert relative percentage to absolute pixel position
  relativeToAbsolute(relativeX, relativeY) {
    const x = this.backgroundOffsetX + (relativeX / 100) * this.displayedBackgroundWidth;
    const y = this.backgroundOffsetY + (relativeY / 100) * this.displayedBackgroundHeight;
    return { x, y };
  }
}

class DraggableSticky {
  constructor(manager, id, relativeX = null, relativeY = null) {
    this.manager = manager;
    this.id = id;
    this.isDragging = false;
    this.offset = { x: 0, y: 0 };
    this.isCollapsed = false;

    // store position as percentage relative to background image
    if (relativeX !== null && relativeY !== null) {
      this.relativePosition = { x: relativeX, y: relativeY };
    } else {
      // random position within the background area (20-80% range)
      this.relativePosition = {
        x: 20 + Math.random() * 60, // 20% to 80% of background width
        y: 20 + Math.random() * 60  // 20% to 80% of background height
      };
    }

    this.createElement();
    this.updateAbsolutePosition();
    this.init();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'sticky-note';
    this.element.innerHTML = `
                    <div class="sticky-header">
                        <input type="text" class="sticky-title" value="example note" placeholder="Enter title...">
                        <div class="header-controls">
                            <input type="color" class="color-picker" value="#ffeb3b">
                            <button class="control-btn collapse-btn" title="Collapse/Expand">−</button>
                            <button class="control-btn delete-btn" title="Delete">×</button>
                        </div>
                    </div>
                    <div class="sticky-content">
                        <textarea class="content-textarea" placeholder="Write your note here...">This is sticky note #${this.id}! This is a minimal sticky note example</textarea>
                    </div>
                `;

    this.manager.workspace.appendChild(this.element);
  }

  updateAbsolutePosition() {
    // do scaling conversion
    const absolute = this.manager.relativeToAbsolute(this.relativePosition.x, this.relativePosition.y);

    // bounds control
    const maxX = window.innerWidth - this.element.offsetWidth;
    const maxY = window.innerHeight - this.element.offsetHeight;

    this.absolutePosition = {
      x: Math.max(0, Math.min(maxX, absolute.x)),
      y: Math.max(0, Math.min(maxY, absolute.y))
    };

    this.element.style.left = this.absolutePosition.x + 'px';
    this.element.style.top = this.absolutePosition.y + 'px';
  }

  init() {

    // listeners to handle listening lmao
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // color picker and buttons menu
    const colorPicker = this.element.querySelector('.color-picker');
    colorPicker.addEventListener('change', this.handleColorChange.bind(this));
    const collapseBtn = this.element.querySelector('.collapse-btn');
    const deleteBtn = this.element.querySelector('.delete-btn');

    collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleCollapse();
    });

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.manager.removeNote(this);
    });

    // stop mouse behavior when dragging
    const inputs = this.element.querySelectorAll('input, textarea, button');
    inputs.forEach(input => {
      input.addEventListener('mousedown', (e) => e.stopPropagation());
    });

    // select a note onclick listener
    this.element.addEventListener('click', () => {
      this.manager.selectNote(this);
      this.manager.updatePositionDisplay();
    });
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

    // keep within viewport bounds
    this.absolutePosition.x = Math.max(0, Math.min(window.innerWidth - this.element.offsetWidth, newX));
    this.absolutePosition.y = Math.max(0, Math.min(window.innerHeight - this.element.offsetHeight, newY));

    // udpate relative position based on new absolute position
    this.relativePosition = this.manager.absoluteToRelative(this.absolutePosition.x, this.absolutePosition.y);

    // stay within background bounds
    this.relativePosition.x = Math.max(0, Math.min(100, this.relativePosition.x));
    this.relativePosition.y = Math.max(0, Math.min(100, this.relativePosition.y));

    this.element.style.left = this.absolutePosition.x + 'px';
    this.element.style.top = this.absolutePosition.y + 'px';

    this.manager.updatePositionDisplay();
  }

  handleMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.element.classList.remove('dragging');
      console.log(`Note #${this.id} moved to relative position: X: ${this.relativePosition.x.toFixed(2)}%, Y: ${this.relativePosition.y.toFixed(2)}%`);
    }
  }

  handleColorChange(e) {
    this.changeColor(e.target.value);
  }

  changeColor(color) {
    this.element.style.backgroundColor = color;
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.element.classList.toggle('collapsed');

    const collapseBtn = this.element.querySelector('.collapse-btn');
    collapseBtn.textContent = this.isCollapsed ? '+' : '−';
    collapseBtn.title = this.isCollapsed ? 'Expand' : 'Collapse';

    console.log(`Note #${this.id} ${this.isCollapsed ? 'collapsed' : 'expanded'}`);
  }
}

// initialize sticky notes manager
const notesManager = new StickyNotesManager();

// handle window resize listener
window.addEventListener('resize', () => {
  notesManager.updateWorkspaceScale();
  notesManager.updatePositionDisplay();
});

console.log('Multi Sticky Notes with background-relative positioning initialized');