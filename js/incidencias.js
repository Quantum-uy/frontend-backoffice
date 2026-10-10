const usuario = getUsuario();
let incidencias = [];
let incidenciaActual = null;
let conductoresCache = [];
const esConductorOPeon = usuario && (usuario.rol === 'conductor' || usuario.rol === 'peon');
const esAdminOperario = usuario && (usuario.rol === 'administrador' || usuario.rol === 'operario');

if (esConductorOPeon) {
    document.getElementById('vista-admin-inc').style.display = 'none';
    document.getElementById('vista-conductor-inc').style.display = 'block';
    cargarContenedoresSelect();

    document.getElementById('form-reporte').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            tipo:        document.getElementById('reporte-tipo').value,
            zona:        document.getElementById('reporte-zona').value,
            ubicacion:   document.getElementById('reporte-ubicacion').value,
            descripcion: document.getElementById('reporte-descripcion').value,
            id_contenedor: document.getElementById('reporte-contenedor').value || null,
            estado:      'abierta'
        };
        try {
            const res = await fetch(API_GESTION + '/incidencias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                document.getElementById('form-reporte').reset();
                alert('Incidencia reportada correctamente');
                cargarIncidencias();
            } else {
                alert('Error al reportar la incidencia');
            }
        } catch (err) {
            alert('Error al conectar con el servidor');
        }
    });
}

if (esAdminOperario) {
    cargarConductores().then(() => cargarIncidencias());
} else {
    cargarIncidencias();
}

async function cargarConductores() {
    try {
        const res = await fetch(API_USUARIOS + '/conductores');
        conductoresCache = await res.json();
    } catch (e) {
        conductoresCache = [];
    }
}

async function cargarContenedoresSelect() {
    try {
        const res = await fetch(API_GESTION + '/contenedores');
        const contenedores = await res.json();
        const sel = document.getElementById('reporte-contenedor');
        sel.innerHTML = '<option value="">Ninguno / No aplica</option>' +
            contenedores.map(c => `<option value="${c.id_contenedor}">${c.ubicacion} (${c.zona})</option>`).join('');
    } catch (e) {
        console.error('Error cargando contenedores:', e);
    }
}

async function cargarIncidencias() {
    try {
        const res = await fetch(API_GESTION + '/incidencias');
        incidencias = await res.json();
        if (esConductorOPeon) {
            renderVistaCondutor(incidencias);
        } else {
            filtrar();
        }
    } catch (e) {
        console.error('Error cargando incidencias:', e);
    }
}

function renderVistaCondutor(data) {
    const container = document.getElementById('mis-reportes');
    const asignadas = data.filter(inc => inc.id_conductor_asignado == usuario.id_usuario && inc.estado !== 'resuelta');
    const reportadas = data.slice(0, 10);

    let html = '';

    if (asignadas.length > 0) {
        html += '<h3 style="margin-bottom:1rem;color:var(--primary)">Incidencias asignadas a mí</h3>';
        html += asignadas.map(inc => `
            <div class="card" style="padding:1rem 1.5rem;margin-bottom:.75rem;display:flex;align-items:center;justify-content:space-between;border-left:4px solid var(--primary)">
                <div>
                    <strong>INC-${String(inc.id_incidencia).padStart(5, '0')}</strong> — ${inc.tipo}
                    <p style="color:#888;font-size:.85rem;margin-top:4px">${inc.ubicacion || ''} · ${inc.zona || ''} · ${inc.fecha_reporte || ''}</p>
                    ${inc.descripcion ? `<p style="font-size:.85rem;margin-top:4px">${inc.descripcion}</p>` : ''}
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                    <span class="badge ${badgeIncidencia(inc.estado)}">${inc.estado}</span>
                    ${inc.estado === 'abierta' ? `<button class="btn btn-primary" style="padding:6px 14px;font-size:.85rem" onclick="tomarIncidencia(${inc.id_incidencia})">Tomar</button>` : ''}
                    ${inc.estado === 'en_proceso' ? `<button class="btn btn-primary" style="padding:6px 14px;font-size:.85rem" onclick="resolverIncidencia(${inc.id_incidencia})">Resolver</button>` : ''}
                </div>
            </div>
        `).join('');
    }

    html += '<h3 style="margin:1.5rem 0 1rem">Últimas incidencias</h3>';
    if (reportadas.length === 0) {
        html += '<div class="card" style="padding:1.5rem;text-align:center;color:#888">No hay incidencias reportadas aún.</div>';
    } else {
        html += reportadas.map(inc => `
            <div class="card" style="padding:1rem 1.5rem;margin-bottom:.75rem;display:flex;align-items:center;justify-content:space-between">
                <div>
                    <strong>${inc.tipo}</strong> — ${inc.ubicacion || 'Sin ubicación'}
                    <p style="color:#888;font-size:.85rem;margin-top:4px">${inc.zona || ''} · ${inc.fecha_reporte || ''}</p>
                </div>
                <span class="badge ${badgeIncidencia(inc.estado)}">${inc.estado}</span>
            </div>
        `).join('');
    }

    container.innerHTML = html;
}

async function tomarIncidencia(id) {
    try {
        await fetch(`${API_GESTION}/incidencias/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'en_proceso', id_conductor_asignado: usuario.id_usuario })
        });
        mostrarToast('Incidencia tomada. Ahora estás a cargo.', 'info');
        cargarIncidencias();
    } catch (e) {
        alert('Error al tomar la incidencia');
    }
}

async function resolverIncidencia(id) {
    if (!confirm('¿Confirmar que la incidencia fue resuelta?')) return;
    try {
        await fetch(`${API_GESTION}/incidencias/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'resuelta' })
        });
        mostrarToast('Incidencia marcada como resuelta.', 'success');
        cargarIncidencias();
    } catch (e) {
        alert('Error al resolver la incidencia');
    }
}

function filtrar() {
    const q = document.getElementById('buscar').value.toLowerCase();
    const estado = document.getElementById('filtro-estado').value;
    const filtrado = incidencias.filter(inc => {
        const matchTexto = (inc.tipo || '').toLowerCase().includes(q) ||
                           (inc.zona || '').toLowerCase().includes(q) ||
                           (inc.ubicacion || '').toLowerCase().includes(q);
        const matchEstado = !estado || inc.estado === estado;
        return matchTexto && matchEstado;
    });
    renderTabla(filtrado);
}

function renderTabla(data) {
    const tbody = document.getElementById('tabla-incidencias');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#999">No hay incidencias</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(inc => `
        <tr>
            <td>INC-${String(inc.id_incidencia).padStart(5, '0')}</td>
            <td>${inc.tipo}</td>
            <td>${inc.zona || '-'}</td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${inc.ubicacion || '-'}</td>
            <td>${inc.fecha_reporte || '-'}</td>
            <td>${inc.contenedor_ubicacion || '-'}</td>
            <td>${inc.conductor_nombre ? inc.conductor_nombre + ' ' + inc.conductor_apellido : '<span style="color:#999">Sin asignar</span>'}</td>
            <td><span class="badge ${badgeIncidencia(inc.estado)}">${inc.estado}</span></td>
            <td><a class="action-link" onclick="verDetalle(${inc.id_incidencia})">Ver / Gestionar</a></td>
        </tr>
    `).join('');
}

function badgeIncidencia(estado) {
    if (estado === 'abierta')    return 'badge-pending';
    if (estado === 'en_proceso') return 'badge-inactive';
    if (estado === 'resuelta')   return 'badge-active';
    return '';
}

function verDetalle(id) {
    incidenciaActual = incidencias.find(x => x.id_incidencia == id);
    if (!incidenciaActual) return;

    const inc = incidenciaActual;
    const imgHtml = inc.imagen
        ? `<img src="${inc.imagen}" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-top:8px">`
        : '';

    document.getElementById('modal-detalle').innerHTML = `
        <table style="width:100%;font-size:14px;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#666;width:40%">ID</td><td><strong>INC-${String(inc.id_incidencia).padStart(5,'0')}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666">Tipo</td><td>${inc.tipo}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Zona</td><td>${inc.zona || '-'}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Ubicación</td><td>${inc.ubicacion || '-'}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Descripción</td><td>${inc.descripcion || '-'}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Contenedor</td><td>${inc.contenedor_ubicacion ? inc.contenedor_ubicacion + ' (' + inc.contenedor_zona + ')' : '-'}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Fecha reporte</td><td>${inc.fecha_reporte || '-'}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Fecha resolución</td><td>${inc.fecha_resolucion || '-'}</td></tr>
        </table>
        ${imgHtml}
    `;

    // Poblar select de conductores
    const selCond = document.getElementById('asignar-conductor');
    selCond.innerHTML = '<option value="">Sin asignar</option>' +
        conductoresCache.map(c => `<option value="${c.id_usuario}" ${c.id_usuario == inc.id_conductor_asignado ? 'selected' : ''}>${c.nombre} ${c.apellido}</option>`).join('');

    document.getElementById('nuevo-estado').value = inc.estado;
    document.getElementById('modal').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modal').classList.remove('active');
    incidenciaActual = null;
}

async function guardarEstado() {
    if (!incidenciaActual) return;
    const nuevoEstado = document.getElementById('nuevo-estado').value;
    const conductorSel = document.getElementById('asignar-conductor').value;

    const body = { estado: nuevoEstado };
    if (esAdminOperario) {
        body.id_conductor_asignado = conductorSel ? parseInt(conductorSel) : null;
    }

    try {
        await fetch(`${API_GESTION}/incidencias/${incidenciaActual.id_incidencia}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        cerrarModal();
        cargarIncidencias();
    } catch (e) {
        alert('Error al actualizar');
    }
}
