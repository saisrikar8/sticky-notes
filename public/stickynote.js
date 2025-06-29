export function createStickyElement(sticky) {
    const el = document.createElement('div');
    el.className = 'sticky';
    el.style.backgroundColor = sticky.color || '#fffc8c';

    // Title
    const title = document.createElement('h4');
    title.textContent = sticky.title || 'Untitled';
    el.appendChild(title);

    // Text
    const text = document.createElement('p');
    text.textContent = sticky.text || '';
    el.appendChild(text);

    return el;
}


function makeDraggable(el, id) {
    let isDragging = false;
    let offsetX, offsetY;

    el.addEventListener('mousedown', (e) => {
        if (e.target === el) {
            isDragging = true;
            offsetX = e.clientX - el.offsetLeft;
            offsetY = e.clientY - el.offsetTop;
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            el.style.left = `${e.clientX - offsetX}px`;
            el.style.top = `${e.clientY - offsetY}px`;
        }
    });

    window.addEventListener('mouseup', async () => {
        if (isDragging) {
            isDragging = false;
            const x = parseInt(el.style.left);
            const y = parseInt(el.style.top);
            await updateStickyPosition(id, x, y);
        }
    });
}

function observeResize(el, id) {
    const observer = new ResizeObserver(entries => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            updateStickySize(id, Math.round(width), Math.round(height));
        }
    });
    observer.observe(el);
}