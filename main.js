import kaplay from "https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs";
kaplay({
    width: 1280,
    height: 720,
    scale: 0.7
});

setBackground(Color.fromHex('#36A6E0'))



loadAssets();

document.addEventListener('DOMContentLoaded', () => {
    Object.assign(document.body.style, {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        margin: '0',
        backgroundImage: "url('./assets/arrows.webp')",
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
    });

    const guide = document.createElement('div');
    guide.id = 'control-guide';
    guide.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px">Controls</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:14px;">
            <div><kbd style="padding:3px 6px;border-radius:4px;background:#222;color:#fff;border:1px solid rgba(255,255,255,0.08)">W / ↑</kbd> Up</div>
            <div><kbd style="padding:3px 6px;border-radius:4px;background:#222;color:#fff;border:1px solid rgba(255,255,255,0.08)"> S / ↓</kbd> Down</div>
            <div><kbd style="padding:3px 6px;border-radius:4px;background:#222;color:#fff;border:1px solid rgba(255,255,255,0.08)">A / ←</kbd> Left</div>
            <div><kbd style="padding:3px 6px;border-radius:4px;background:#222;color:#fff;border:1px solid rgba(255,255,255,0.08)">D / →</kbd> Right</div>

        </div>
    `;
    Object.assign(guide.style, {
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        background: 'rgba(0,0,0,0.65)',
        color: '#fff',
        padding: '12px 14px',
        borderRadius: '10px',
        zIndex: '9999',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        width: '220px',
        lineHeight: '1.25',
    });

    const toggle = document.createElement('button');
    toggle.textContent = '?';
    Object.assign(toggle.style, {
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        width: '24px',
        height: '24px',
        borderRadius: '18px',
        background: '#111',
        color: '#fff',
        border: 'none',
        zIndex: '10000',
        cursor: 'pointer',
        fontWeight: '700',
    });

    document.body.appendChild(guide);
    document.body.appendChild(toggle);
    guide.style.display = 'block';

    toggle.addEventListener('click', () => {
        if (guide.style.display === 'none') {
            guide.style.display = 'block';
            toggle.textContent = '?';
        } else {
            guide.style.display = 'none';
            toggle.textContent = '⌵';
        }
    });
});

scene('world', (worldState) => setWorld(worldState));
go('world');