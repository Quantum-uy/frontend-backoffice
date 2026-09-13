const usuario = getUsuario();
let rutas = [];
let conductores = [];
let camionesDisponibles = [];
const esConductorOPeon = usuario && (usuario.rol === 'conductor' || usuario.rol === 'peon');

if (esConductorOPeon) {
    document.getElementById('vista-admin').style.display = 'none';
    document.getElementById('vista-conductor').style.display = 'block';
}

cargarRutas();
if (!esConductorOPeon) cargarDropdowns();

async function cargarDropdowns() {
    try {
        const [cRes, camRes] = await Promise.all([
            fetch(API_USUARIOS + '/conductores'),
            fetch(API_CAMIONES + '/camiones')
        ]);
        conductores = await cRes.json();
        camionesDisponibles = await camRes.json();
    } catch (e) {
        console.error('Error cargando dropdowns:', e);
    }
}

function llenarDropdowns(ruta) {
    const selCond = document.getElementById('id_conductor');
    selCond.innerHTML = '<option value="">Sin asignar</option>' +
        conductores.map(c => `<option value="${c.id_usuario}" ${ruta && ruta.id_conductor == c.id_usuario ? 'selected' : ''}>${c.nombre} ${c.apellido}</option>`).join('');

    const selCam = document.getElementById('id_camion_ruta');
    selCam.innerHTML = '<option value="">Sin asignar</option>' +
        camionesDisponibles.map(c => `<option value="${c.id_camion}" ${ruta && ruta.id_camion == c.id_camion ? 'selected' : ''}>${c.matricula} - ${c.modelo}</option>`).join('');
}

async function cargarRutas() {
    try {
        const res = await fetch(API_GESTION + '/rutas');
        rutas = await res.json();
        if (esConductorOPeon) {
            renderListaConductor(rutas.filter(r => r.estado === 'activa'));
        } else {
            renderTabla(rutas);
        }
    } catch (e) {
        console.error('Error cargando rutas:', e);
    }
}

function renderListaConductor(data) {
    const container = document.getElementById('lista-rutas-conductor');
    const misRutas = data.filter(r => r.id_conductor == usuario.id_usuario);

    if (misRutas.length === 0) {
        container.innerHTML = '<div class="card" style="padding:2rem;text-align:center;color:#888">No tenés rutas asignadas por el momento.</div>';
        return;
    }
    container.innerHTML = misRutas.map(r => `
        <div class="card" style="padding:1.5rem;margin-bottom:1rem" id="ruta-card-${r.id_ruta}">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
                <div style="display:flex;align-items:center;gap:1rem">
                    <div style="width:12px;height:12px;border-radius:50%;background:${r.color || '#1a5c52'}"></div>
                    <div>
                        <strong style="font-size:1.1rem">${r.nombre}</strong>
                        <p style="color:#666;margin-top:4px">${r.zona} ${r.numero > 1 ? '(sub-zona ' + r.numero + ')' : ''}</p>
                    </div>
                </div>
                <span class="badge ${r.camion_estado === 'en_ruta' ? 'badge-warning' : 'badge-success'}">${r.camion_estado === 'en_ruta' ? 'En recorrido' : 'Disponible'}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1rem;font-size:.9rem">
                <div><strong>Camión:</strong> ${r.camion || 'Sin asignar'}</div>
                <div><strong>Peón:</strong> ${r.peon || 'Sin asignar'}</div>
                <div><strong>Contenedores:</strong> ${r.contenedores ? r.contenedores.length : 0}</div>
            </div>
            ${r.descripcion ? `<p style="color:#666;font-size:.85rem;margin-bottom:1rem">${r.descripcion}</p>` : ''}
            <div style="display:flex;gap:.75rem">
                ${r.camion_estado !== 'en_ruta'
                    ? `<button class="btn btn-primary" onclick="iniciarRecorrido(${r.id_ruta}, ${r.id_camion})">Iniciar recorrido</button>`
                    : `<button class="btn btn-outline" onclick="finalizarRecorrido(${r.id_ruta}, ${r.id_camion})">Finalizar recorrido</button>`
                }
                <button class="btn ${r.completada ? 'btn-outline' : 'btn-primary'}" onclick="toggleCompletada(${r.id_ruta})" style="min-width:140px">
                    ${r.completada ? '✓ Completada' : 'Marcar completada'}
                </button>
            </div>
        </div>
    `).join('');
}

async function iniciarRecorrido(idRuta, idCamion) {
    if (!idCamion) { alert('Esta ruta no tiene camión asignado'); return; }
    try {
        await fetch(`${API_CAMIONES}/camiones/${idCamion}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'en_ruta' })
        });
        cargarRutas();
    } catch (e) {
        alert('Error al iniciar recorrido');
    }
}

async function finalizarRecorrido(idRuta, idCamion) {
    if (!idCamion) return;
    try {
        await fetch(`${API_CAMIONES}/camiones/${idCamion}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'disponible' })
        });
        cargarRutas();
    } catch (e) {
        alert('Error al finalizar recorrido');
    }
}

function toggleCompletada(id) {
    const r = rutas.find(x => x.id_ruta == id);
    if (!r) return;
    r.completada = !r.completada;
    renderListaConductor(rutas.filter(r => r.estado === 'activa'));
}

function renderTabla(data) {
    const tbody = document.getElementById('tabla-rutas');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999">No hay rutas registradas</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(r => `
        <tr>
            <td>${r.nombre} ${r.numero > 1 ? '<small style="color:#888">(#' + r.numero + ')</small>' : ''}</td>
            <td>${r.zona}</td>
            <td>${r.conductor || '<span style="color:#999">Sin asignar</span>'}</td>
            <td>${r.camion || '<span style="color:#999">Sin asignar</span>'}</td>
            <td>${r.contenedores ? r.contenedores.length : 0}</td>
            <td><span class="badge ${r.estado === 'activa' ? 'badge-active' : 'badge-inactive'}">${r.estado}</span></td>
            <td>
                <a class="action-link" onclick="editar(${r.id_ruta})">Editar</a>
                <a class="action-link delete" onclick="eliminar(${r.id_ruta})">Eliminar</a>
            </td>
        </tr>
    `).join('');
}

function filtrar() {
    const q = document.getElementById('buscar').value.toLowerCase();
    const filtrado = rutas.filter(r =>
        r.nombre.toLowerCase().includes(q) ||
        r.zona.toLowerCase().includes(q) ||
        r.estado.toLowerCase().includes(q) ||
        (r.conductor && r.conductor.toLowerCase().includes(q))
    );
    renderTabla(filtrado);
}

function abrirModal() {
    document.getElementById('modal-titulo').textContent = 'Agregar ruta';
    document.getElementById('form-ruta').reset();
    document.getElementById('color').value = '#1a5c52';
    document.getElementById('ruta-id').value = '';
    document.getElementById('numero').value = 1;
    llenarDropdowns(null);
    document.getElementById('modal').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modal').classList.remove('active');
}

function editar(id) {
    const r = rutas.find(x => x.id_ruta == id);
    if (!r) return;
    document.getElementById('modal-titulo').textContent = 'Editar ruta';
    document.getElementById('ruta-id').value = r.id_ruta;
    document.getElementById('nombre').value = r.nombre;
    document.getElementById('zona').value = r.zona;
    document.getElementById('numero').value = r.numero || 1;
    document.getElementById('descripcion').value = r.descripcion || '';
    document.getElementById('color').value = r.color || '#1a5c52';
    document.getElementById('estado').value = r.estado;
    llenarDropdowns(r);
    document.getElementById('modal').classList.add('active');
}

async function eliminar(id) {
    if (!confirm('¿Eliminar esta ruta? Los contenedores asignados quedarán sin ruta.')) return;
    try {
        await fetch(`${API_GESTION}/rutas/${id}`, { method: 'DELETE' });
        cargarRutas();
    } catch (e) {
        alert('Error al eliminar');
    }
}

document.getElementById('form-ruta').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('ruta-id').value;
    const body = {
        nombre:       document.getElementById('nombre').value,
        zona:         document.getElementById('zona').value,
        numero:       parseInt(document.getElementById('numero').value) || 1,
        descripcion:  document.getElementById('descripcion').value,
        color:        document.getElementById('color').value,
        estado:       document.getElementById('estado').value,
        id_conductor: document.getElementById('id_conductor').value || null,
        id_camion:    document.getElementById('id_camion_ruta').value || null,
    };

    try {
        if (id) {
            await fetch(`${API_GESTION}/rutas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } else {
            await fetch(`${API_GESTION}/rutas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        }
        cerrarModal();
        cargarRutas();
    } catch (e) {
        alert('Error al guardar');
    }
});
