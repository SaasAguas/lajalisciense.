// --- CÓDIGO DE CREADOR ---
const CREATOR_CODE = "08020824";
const DB_KEY = 'ferguz_corp_v9.1'; 

const defaultFlavors = [
    {n:'Jamaica', t:'fruta', s:20}, {n:'Maracuya', t:'fruta', s:20}, {n:'Ciruela', t:'fruta', s:20},
    {n:'Lima', t:'fruta', s:20}, {n:'Fresa-Hierbabuena', t:'fruta', s:20}, {n:'Fresa', t:'fruta', s:20},
    {n:'Guayaba-Hierbabuena', t:'fruta', s:20}, {n:'Guayaba-Fresa', t:'fruta', s:20}, {n:'Piña-Alfalfa', t:'fruta', s:20},
    {n:'Guayaba', t:'fruta', s:20}, {n:'Lima-Albahaca', t:'fruta', s:20}, {n:'Melón', t:'fruta', s:20},
    {n:'Hierbabuena-Limón', t:'fruta', s:20}, {n:'Mango', t:'fruta', s:20}, {n:'Limón-Alfalfa', t:'fruta', s:20},
    {n:'Piña-Naranja', t:'fruta', s:20}, {n:'Limón-Hierbabuena', t:'fruta', s:20}, {n:'Piña-Hierbabuena', t:'fruta', s:20},
    {n:'Limón-Chia', t:'fruta', s:20}, {n:'Limón Pepino', t:'fruta', s:20}, {n:'Piña Naranja H.', t:'fruta', s:20},
    {n:'Melón Cítrico', t:'fruta', s:20}, {n:'Lima-Stevia', t:'fruta', s:20},
    {n:'Horchata Fresa', t:'crema', s:15}, {n:'Horchata Arroz', t:'crema', s:15}, {n:'Vainilla', t:'crema', s:15},
    {n:'Mazapán', t:'crema', s:15}, {n:'Chai', t:'crema', s:15}, {n:'Taro', t:'crema', s:15},
    {n:'Coco c/ Nuez', t:'crema', s:15}, {n:'Cebada', t:'crema', s:15}, {n:'Kalhua', t:'crema', s:15},
    {n:'Crema Irlandesa', t:'crema', s:15},
    {n:'Paleta-Leche', t:'paleta', s:20, p:30}, {n:'Paleta-Agua', t:'paleta', s:20, p:25},
    {n:'Fresas Con Crema', t:'paleta', s:20, p:25}, {n:'Sandwich', t:'paleta', s:20, p:20},
    {n:'Campana', t:'paleta', s:20, p:20},
    {n:'Frapuchino', t:'paleta', s:999, p:10, hidden: true}
];

let oldDb = JSON.parse(localStorage.getItem('jalisciense_corp_v9.0'));
let db = JSON.parse(localStorage.getItem(DB_KEY));

if (!db) {
    if (oldDb) { db = oldDb; } 
    else {
        db = {
            users: { 'zekkqi': { pass: '0802', role: 'ceo' } },
            cash: 0, soldL: 0, soldP: 0, prodL: 0, prodP: 0,
            currentHistory: [], historicalCuts: [], inventory: defaultFlavors
        };
    }
}

let cart = [];
let prodMode = 'fruta';
let invView = 'fruta';
let CURRENT_USER = null;

function save() { localStorage.setItem(DB_KEY, JSON.stringify(db)); updateUI(); }

function toggleAuthView(view) {
    document.getElementById('view-login').style.display = view === 'login' ? 'block' : 'none';
    document.getElementById('view-register').style.display = view === 'register' ? 'block' : 'none';
}

function attemptRegister() {
    const u = document.getElementById('reg-user').value.toLowerCase().trim();
    const p = document.getElementById('reg-pass').value;
    const r = document.getElementById('reg-role').value;
    const c = document.getElementById('reg-code').value;

    if(!u || !p) return alert("Llena usuario y contraseña");
    if(db.users[u]) return alert("Este usuario ya existe");
    if(c !== CREATOR_CODE) return alert("❌ Código de Aprobación Incorrecto");

    db.users[u] = { pass: p, role: r };
    save(); alert(`✅ Usuario ${u} registrado exitosamente como ${r.toUpperCase()}`);
    toggleAuthView('login');
}

function attemptLogin() {
    const u = document.getElementById('login-user').value.toLowerCase().trim();
    const p = document.getElementById('login-pass').value;
    const err = document.getElementById('login-error');

    if (db.users[u] && db.users[u].pass === p) {
        CURRENT_USER = { username: u, role: db.users[u].role };
        document.getElementById('user-display').innerText = u.toUpperCase();
        document.getElementById('role-display').innerText = CURRENT_USER.role.toUpperCase();
        document.getElementById('login-overlay').style.display = 'none';
        
        applyRolePermissions(CURRENT_USER.role);
        checkLowStockAlert();
        
        document.getElementById('login-user').value = '';
        document.getElementById('login-pass').value = '';
        err.style.display = 'none';
    } else { err.style.display = 'block'; }
}

function doLogout() {
    CURRENT_USER = null;
    document.getElementById('login-overlay').style.display = 'flex';
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
}

function applyRolePermissions(role) {
    const isEmployee = role === 'empleado';
    document.querySelectorAll('.hidden-role').forEach(el => { el.style.display = isEmployee ? 'none' : ''; });
    go('pos', document.getElementById('nav-pos'));
}

function go(screenId, btn) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
    document.getElementById('screen-'+screenId).classList.add('active-screen');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    updateUI();
}

function checkLowStockAlert() {
    const lowItems = db.inventory.filter(i => !i.hidden && i.t !== 'paleta' && i.s <= 10);
    if(lowItems.length > 0 && CURRENT_USER.role !== 'empleado') {
        let msg = lowItems.map(i => `${i.n} (${i.s} L)`).join('\n');
        alert(`⚠️ ALERTA DE STOCK BAJO (10L o menos):\n\n${msg}\n\nFavor de programar producción.`);
    }
}

function setFilter(type, btn) {
    const grid = document.getElementById('flavors-grid');
    const pc = document.getElementById('price-container');
    const fm = document.getElementById('fixed-price-msg');
    grid.innerHTML = '';
    if(type === 'paleta') { pc.style.display='none'; fm.style.display='block'; }
    else { pc.style.display='block'; fm.style.display='none'; }
    
    db.inventory.sort((a,b)=>a.n.localeCompare(b.n)).forEach(item => {
        if(item.t !== type) return;
        const card = document.createElement('div');
        card.className = 'flavor-card';
        card.onclick = () => addToCart(item);
        
        let cs = 'color:var(--text)'; let pd = '';
        if(item.t === 'crema') cs = 'color:#40C4FF';
        else if (item.t === 'fruta') cs = 'color:var(--primary)';
        else if(item.t==='paleta') { cs='color:var(--primary)'; pd=`<div style="color:#00E676;font-weight:bold;font-size:0.9rem;">$${item.p||10}</div>`; }
        
        let stockDisp = item.hidden ? "♾️" : (item.s <= 10 ? `⚠️ ${item.s}` : item.s);
        let badgeStyle = (item.s <= 10 && !item.hidden) ? 'background:#FFEBEE; color:var(--danger);' : '';
        
        card.innerHTML = `<strong style="${cs}">${item.n}</strong><br>${pd}<span class="stock-badge" style="${badgeStyle}">${stockDisp}</span>`;
        grid.appendChild(card);
    });
    if(btn) { document.querySelectorAll('#screen-pos .filter-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }
}

function addToCart(item) {
    if(item.s <= 0) return alert("Sin stock");
    let price = (item.t==='paleta')?(item.p||10):parseFloat(document.getElementById('price-select').value);
    const ex = cart.find(c=>c.name===item.n && c.price===price);
    if(ex) { if(ex.qty>=item.s) return alert("No hay stock"); ex.qty++; }
    else cart.push({name:item.n, price:price, qty:1, type:item.t, isHidden: item.hidden});
    updateCartUI();
}

function updateCartUI() {
    const bar = document.getElementById('cart-bar');
    if(cart.length>0) {
        bar.style.display='flex';
        const t = cart.reduce((a,i)=>a+(i.price*i.qty),0);
        const c = cart.reduce((a,i)=>a+i.qty,0);
        document.getElementById('cart-total').innerText=`$${t}`;
        document.getElementById('cart-count').innerText=c;
    } else bar.style.display='none';
}

function showCheckout() {
    const list = document.getElementById('checkout-list');
    list.innerHTML = ''; let t = 0;
    cart.forEach((i, idx) => {
        t += i.price*i.qty;
        const u = i.type==='paleta'?'pz':'L';
        list.innerHTML += `<div class="cart-list-item"><div><strong>${i.name}</strong><br>${i.qty}${u} x $${i.price} = $${i.price*i.qty}</div><button class="delete-btn" onclick="removeFromCart(${idx})">✕</button></div>`;
    });
    document.getElementById('checkout-total').innerText = `Total: $${t}`;
    document.getElementById('checkout-modal').style.display='flex';
}

function removeFromCart(idx) {
    cart.splice(idx,1); updateCartUI();
    if(cart.length===0) document.getElementById('checkout-modal').style.display='none';
    else showCheckout();
}

function finishSale() {
    let tc = 0, tl = 0, tp = 0; let exactDetails = [];
    
    cart.forEach(c => {
        const i = db.inventory.find(inv=>inv.n===c.name);
        if(i && !i.hidden) i.s -= c.qty;
        tc += c.price*c.qty;
        const u = c.type==='paleta'?'pz':'L';
        exactDetails.push(`${c.qty}${u} de ${c.name}`);
        if(c.type==='paleta') tp += c.qty; else tl += c.qty;
    });

    db.cash += tc; db.soldL += tl; db.soldP += tp;

    const d = new Date();
    const timeStr = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const dateStr = d.toLocaleDateString();
    
    let clientType = "Mixto";
    const selectEl = document.getElementById('price-select');
    if(tl > 0) clientType = selectEl.options[selectEl.selectedIndex].dataset.tipo + ` ($${selectEl.value}xL)`;
    if(tl === 0 && tp > 0) clientType = "Paletas";

    let sumTotal = [];
    if(tl>0) sumTotal.push(`${tl}L`);
    if(tp>0) sumTotal.push(`${tp} Paletas`);

    db.currentHistory.unshift({
        id: Date.now(), type: 'VENTA', date: dateStr, time: timeStr, user: CURRENT_USER.username.toUpperCase(),
        exact: exactDetails.join(', '), sum: sumTotal.join(' y '), money: `+$${tc}`, client: clientType
    });

    cart=[]; document.getElementById('checkout-modal').style.display='none';
    save(); alert("✅ Venta registrada con éxito");
    const ab = document.querySelector('#screen-pos .filter-btn.active'); if(ab) ab.click();
}

function setProdMode(m) {
    prodMode = m;
    ['fruta','crema','paleta'].forEach(mode => { document.getElementById(`btn-prod-${mode}`).className = 'filter-btn' + (mode===m?' active':''); });
    document.getElementById('prod-subtitle').innerText = m==='paleta'?'Relleno de Paletas':'Producción de '+m;
    renderProdSelect();
}

function renderProdSelect() {
    const s = document.getElementById('prod-flavor');
    s.innerHTML = '';
    db.inventory.sort((a,b)=>a.n.localeCompare(b.n)).forEach(i => {
        if(i.t===prodMode && !i.hidden) s.innerHTML += `<option value="${i.n}">${i.n}</option>`;
    });
}

function adjustProd(a) {
    const i = document.getElementById('prod-qty');
    let v = parseInt(i.value)+a; if(v<1) v=1; i.value=v;
}

function saveProduction() {
    const n = document.getElementById('prod-flavor').value;
    const q = parseInt(document.getElementById('prod-qty').value);
    const i = db.inventory.find(inv=>inv.n===n);
    if(i) {
        i.s += q;
        if(i.t==='paleta') db.prodP += q; else db.prodL += q;
        const u = i.t==='paleta'?'pz':'L';
        const d = new Date();
        db.currentHistory.unshift({
            id: Date.now(), type: 'PROD', date: d.toLocaleDateString(), time: d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            user: CURRENT_USER.username.toUpperCase(), exact: `${q}${u} de ${n}`, sum: '-', money: '-', client: '-'
        });
        save(); alert("🏭 Producción Guardada");
    }
}

function toggleInvView() {
    if(invView==='fruta') invView='crema'; else if(invView==='crema') invView='paleta'; else invView='fruta';
    updateUI();
}

function updateUI() {
    document.getElementById('stat-cash').innerText=`$${db.cash}`;
    document.getElementById('stat-sold-l').innerText=`${db.soldL||0} L`;
    document.getElementById('stat-sold-p').innerText=`${db.soldP||0} Pz`;
    document.getElementById('stat-prod-l').innerText=`${db.prodL||0} L`;
    document.getElementById('stat-prod-p').innerText=`${db.prodP||0} Pz`;
    document.getElementById('inv-title').innerText='Inventario de '+invView.toUpperCase();
    
    const invC = document.getElementById('inv-container'); invC.innerHTML = '';
    db.inventory.sort((a,b)=>a.n.localeCompare(b.n)).forEach(i => {
        if(i.t===invView && !i.hidden) {
            let pct = Math.min((i.s / 100) * 100, 100); 
            let barColor = i.s <= 10 ? 'var(--danger)' : (i.t==='paleta' ? '#40C4FF' : 'var(--primary)');
            let warningTag = i.s <= 10 ? '<span style="color:var(--danger); font-size:0.8rem;">(Stock Bajo)</span>' : '';
            let unit = i.t === 'paleta' ? 'pz' : 'L';
            invC.innerHTML += `<div class="inv-row"><div class="inv-info"><span>${i.n} ${warningTag}</span><span style="color:var(--primary);">${i.s} ${unit}</span></div><div class="progress-bg"><div class="progress-fill" style="width:${pct}%; background:${barColor};"></div></div></div>`;
        }
    });
    renderHistory(); renderHistoricalCuts(); renderProdSelect(); updateCartUI();
}

function renderHistory() {
    const hc = document.getElementById('hist-current-container'); hc.innerHTML = '';
    if(db.currentHistory.length === 0) hc.innerHTML = '<p style="text-align:center; color:#999; font-size:0.9rem;">Sin movimientos en este turno.</p>';
    db.currentHistory.forEach(h => {
        let badge = h.type === 'VENTA' ? 'badge-venta' : 'badge-prod';
        let moneyStr = h.money !== '-' ? `<span style="color:#00E676; font-weight:bold; font-size:1.1rem; text-shadow: 0px 1px 1px rgba(0,0,0,0.1);">${h.money}</span>` : '';
        hc.innerHTML += `<div class="history-card"><div class="hist-header"><span><span class="hist-badge ${badge}">${h.type}</span> 🕒 ${h.time}</span><span style="color:var(--primary); font-weight:bold;">👤 ${h.user}</span></div><div style="font-weight:bold; font-size:0.95rem;">${h.sum} ${moneyStr}</div><div style="font-size:0.85rem; color:#444; margin-top:5px;">Detalle: ${h.exact}</div>${h.client !== '-' ? `<div style="font-size:0.8rem; color:#888; margin-top:5px;">📋 Cliente: ${h.client}</div>` : ''}</div>`;
    });
}

function closeDay() {
    if(!confirm("⚠️ ¿Estás seguro de hacer el Corte de Caja?\nEsto cerrará el turno actual y guardará los reportes en el historial.")) return;
    const d = new Date();
    const cutObj = { id: Date.now(), dateGroup: `Cortes ${d.toLocaleDateString('es-MX', {day: 'numeric', month: 'long', year: 'numeric'})}`, time: d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), stats: { cash: db.cash, sl: db.soldL, sp: db.soldP, pl: db.prodL, pp: db.prodP }, movements: [...db.currentHistory] };
    db.historicalCuts.unshift(cutObj); 
    db.currentHistory = []; db.cash=0; db.soldL=0; db.soldP=0; db.prodL=0; db.prodP=0; 
    save(); alert("🔒 Corte de caja realizado exitosamente.");
}

function renderHistoricalCuts() {
    const container = document.getElementById('hist-cuts-container'); container.innerHTML = '';
    const groups = {};
    db.historicalCuts.forEach(cut => { if(!groups[cut.dateGroup]) groups[cut.dateGroup] = []; groups[cut.dateGroup].push(cut); });
    for(const date in groups) {
        let cutButtons = groups[date].map(c => `<button class="btn btn-sm" style="background:var(--bg); color:var(--primary); margin-top:5px; margin-right:5px; border: 1px solid var(--primary-light);" onclick="openCutDetail(${c.id})">🕒 Corte ${c.time}</button>`).join('');
        container.innerHTML += `<div class="hist-cut-group"><div class="hist-cut-title">📅 ${date}</div><div style="display:flex; flex-wrap:wrap;">${cutButtons}</div></div>`;
    }
}

function openCutDetail(id) {
    const cut = db.historicalCuts.find(c => c.id === id); if(!cut) return;
    document.getElementById('cut-detail-title').innerText = `Reporte: ${cut.time}`;
    document.getElementById('cut-detail-stats').innerHTML = `<strong>Total en Caja:</strong> <span style="color:#00E676; font-size:1.1rem; font-weight:bold;">$${cut.stats.cash}</span><br><strong>Ventas:</strong> ${cut.stats.sl}L de Agua | ${cut.stats.sp} Paletas<br><strong>Producción:</strong> ${cut.stats.pl}L de Agua | ${cut.stats.pp} Paletas`;
    const listC = document.getElementById('cut-detail-list');
    listC.innerHTML = cut.movements.map(h => `<div style="border-bottom:1px solid #ddd; padding:8px 0;"><strong style="color:var(--primary);">${h.type} (${h.time}) - 👤 ${h.user}</strong><br>${h.sum} ${h.money !== '-' ? `<b>(${h.money})</b>` : ''}<br><span style="color:#666;">${h.exact}</span>${h.client && h.client !== '-' ? `<br><span style="font-size:0.8rem; color:#888; font-weight:bold;">📋 Cliente: ${h.client}</span>` : ''}</div>`).join('') || '<p>No hubo movimientos en este turno.</p>';
    document.getElementById('cut-detail-modal').style.display = 'flex';
}

function clearHistory() { if(confirm("🛑 PELIGRO: ¿BORRAR TODOS los cortes?")) { if(confirm("⚠️ CONFIRMACIÓN FINAL.")) { db.historicalCuts = []; db.currentHistory = []; save(); alert("Historial eliminado."); } } }

function downloadExcel() {
    let csv = "\uFEFFFecha,Hora,Usuario,Tipo,Movimiento,Suma,Ingreso,Cliente\n";
    db.historicalCuts.forEach(cut => { cut.movements.forEach(h => { let cleanDet = h.exact.replace(/,/g, ' '); csv += `${h.date},${h.time},${h.user},${h.type},"${cleanDet}",${h.sum},${h.money},${h.client}\n`; }); });
    const a = document.createElement('a'); a.href = window.URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8;'})); a.download = `Reporte_Ferguz_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`; a.click();
}

function openSettings() { document.getElementById('settings-modal').style.display='flex'; }
function closeSettings() { document.getElementById('settings-modal').style.display='none'; }
function showAddFlavor() { document.getElementById('new-flavor-name').value = ''; document.getElementById('new-flavor-stock').value = ''; document.getElementById('add-flavor-modal').style.display='flex'; }
function saveNewFlavor() { const n = document.getElementById('new-flavor-name').value.trim(); const t = document.getElementById('new-flavor-type').value; const s = parseInt(document.getElementById('new-flavor-stock').value) || 0; if(!n) return alert("Ingresa un nombre."); if(db.inventory.find(i => i.n.toLowerCase() === n.toLowerCase())) return alert("Ese sabor ya existe."); db.inventory.push({n: n, t: t, s: s}); save(); document.getElementById('add-flavor-modal').style.display='none'; alert("✅ Sabor registrado"); }
function showAddPaleta() { document.getElementById('new-paleta-name').value = ''; document.getElementById('new-paleta-price').value = ''; document.getElementById('new-paleta-stock').value = ''; document.getElementById('add-paleta-modal').style.display='flex'; }
function saveNewPaleta() { const n = document.getElementById('new-paleta-name').value.trim(); const p = parseFloat(document.getElementById('new-paleta-price').value) || 0; const s = parseInt(document.getElementById('new-paleta-stock').value) || 0; if(!n) return alert("Ingresa un nombre."); if(db.inventory.find(i => i.n.toLowerCase() === n.toLowerCase())) return alert("Esta paleta ya existe."); db.inventory.push({n: n, t: 'paleta', s: s, p: p}); save(); document.getElementById('add-paleta-modal').style.display='none'; alert("✅ Paleta registrada"); }
function showEditFlavors() { renderEditList(); document.getElementById('edit-flavors-modal').style.display='flex'; }
function renderEditList() {
    const c = document.getElementById('edit-list-container'); c.innerHTML = '';
    db.inventory.sort((a,b)=>a.n.localeCompare(b.n)).forEach((item, index) => {
        if(item.hidden) return; 
        let tOps = item.t==='paleta' ? `<option value="paleta" selected>Paleta</option>` : `<option value="fruta" ${item.t==='fruta'?'selected':''}>Fruta</option><option value="crema" ${item.t==='crema'?'selected':''}>Crema</option>`;
        let pHtml = item.t==='paleta' ? `<input type="number" id="e-p-${index}" value="${item.p}" style="width:50px; padding:5px; border:1px solid #ccc; border-radius:5px;">` : ``;
        c.innerHTML += `<div style="background:#f9f9f9; padding:10px; margin-bottom:10px; border-radius:8px; border:1px solid #ddd;"><div style="display:flex; gap:5px; margin-bottom:5px;"><input type="text" id="e-n-${index}" value="${item.n}" style="flex:1; padding:5px; border-radius:5px; font-weight:bold; color:var(--primary);"><select id="e-t-${index}" style="padding:5px; border-radius:5px;">${tOps}</select></div><div style="display:flex; gap:5px; align-items:center; justify-content:flex-end;">${pHtml} <span style="font-size:0.8rem;">Stock:</span><input type="number" id="e-s-${index}" value="${item.s}" style="width:55px; padding:5px; border-radius:5px;"><button class="btn-success" style="padding:5px 10px; border-radius:5px; border:none; background:#00E676; color:#004d25;" onclick="saveEdit(${index})">💾</button><button class="btn-danger" style="padding:5px 10px; border-radius:5px; border:none;" onclick="deleteItem(${index})">🗑️</button></div></div>`;
    });
}
function saveEdit(idx) { const i = db.inventory[idx]; i.n = document.getElementById(`e-n-${idx}`).value; i.t = document.getElementById(`e-t-${idx}`).value; i.s = parseInt(document.getElementById(`e-s-${idx}`).value) || 0; if(i.t==='paleta') i.p = parseFloat(document.getElementById(`e-p-${idx}`).value) || 0; save(); alert("✅ Cambios guardados."); const ab = document.querySelector('#screen-pos .filter-btn.active'); if(ab) ab.click(); }
function deleteItem(idx) { if(confirm("⚠️ ¿Eliminar este producto permanentemente?")) { db.inventory.splice(idx, 1); save(); renderEditList(); const ab = document.querySelector('#screen-pos .filter-btn.active'); if(ab) ab.click(); } }

// Inicialización de la pantalla
window.onload = () => {
    const firstBtn = document.querySelector('.filter-btn');
    if(firstBtn) setFilter('fruta', firstBtn);
};
