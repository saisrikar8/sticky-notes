import { createStickyElement } from './stickynote.js';
console.log("loading controller");
// fetch group details, then  fetch coordinates of stickies from server

const map = document.getElementById('map');
let currentGroupId = window.location.href.split("/");
currentGroupId = currentGroupId[currentGroupId.length - 1];
async function getStickyNotes() {
  const res = await fetch('/api/get-stickies', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to get stickies');
  return await res.json();
}
window.addEventListener('DOMContentLoaded', async () => {
  try {

    // Load stickies
    const stickies = await getStickyNotes();
    console.log(stickies)
    stickies.forEach(sticky => renderSticky(sticky, map));

    map.addEventListener('dblclick', async (e) => {
      const title = prompt("Sticky title:");
      const text = prompt("Sticky content:");
      const color = prompt("Sticky color:", "#fffc8c");

      if (!title || !text) return;

      const res = await postSticky(title, text, color, currentGroupId, e.clientX, e.clientY);
      const newSticky = {
        _id: res.id,
        title,
        text,
        color,
        x: e.clientX,
        y: e.clientY,
        width: 150,
        height: 150,
      };
      renderSticky(newSticky, map);
    });
  } catch (err) {
    console.log(err);
    // Not authenticated or other error — redirect to login
    window.location.href = '/login';
  }
});


function renderSticky(sticky, map) {
  const el = createStickyElement(sticky);
  el.dataset.id = sticky._id;
  el.style.left = `${sticky.x}px`;
  el.style.top = `${sticky.y}px`;
  el.style.width = sticky.width ? `${sticky.width}px` : '150px';
  el.style.height = sticky.height ? `${sticky.height}px` : '150px';

  // Show coordinates inside sticky
  let xyLabel = el.querySelector('.xy-label');
  if (!xyLabel) {
    xyLabel = document.createElement('div');
    xyLabel.className = 'xy-label';
    el.appendChild(xyLabel);
  }
  xyLabel.textContent = `(x: ${sticky.x}, y: ${sticky.y})`;

  map.appendChild(el);

  makeDraggable(el);
  observeResize(el);
}

function makeDraggable(el) {
  let isDragging = false;
  let offsetX, offsetY;

  el.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
    el.style.zIndex = 1000;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const x = e.pageX - offsetX;
    const y = e.pageY - offsetY;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    const xyLabel = el.querySelector('.xy-label');
    if (xyLabel) {
      xyLabel.textContent = `(x: ${x}, y: ${y})`;
    }
  });

  window.addEventListener('mouseup', async () => {
    if (!isDragging) return;
    isDragging = false;
    el.style.zIndex = '';
    const x = parseInt(el.style.left);
    const y = parseInt(el.style.top);
    await updateStickyPosition(el.dataset.id, x, y);
  });
}

function observeResize(el) {
  const observer = new ResizeObserver(async () => {
    const id = el.dataset.id;
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    if (!id || isNaN(width) || isNaN(height)) return;
    await updateStickySize(id, width, height);
  });
  observer.observe(el);
}

async function updateStickyPosition(id, x, y) {
  await fetch('/api/update-sticky-position', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, x, y }),
  });
}

async function updateStickySize(id, width, height) {
  await fetch('/api/update-sticky-size', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, width, height }),
  });
}
