const usuario = getUsuario();
let incidencias = [];
let incidenciaActual = null;

cargarIncidencias();

async function cargarIncidencias() {
    try {
        const res = await fetch(API_GESTION + '/incidencias');
        incidencias = await res.json();
        filtrar();
    } catch (e) {
        console.error('Error cargando incidencias:', e);
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
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999">No hay incidencias</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(inc => `
        <tr>
            <td>INC-${String(inc.id_incidencia).padStart(5, '0')}</td>
            <td>${inc.tipo}</td>
            <td>${inc.zona || '-'}</td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${inc.ubicacion || '-'}</td>
            <td>${inc.fecha_reporte || '-'}</td>
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
            <tr><td style="padding:6px 0;color:#666">Fecha reporte</td><td>${inc.fecha_reporte || '-'}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Fecha resolución</td><td>${inc.fecha_resolucion || '-'}</td></tr>
        </table>
        ${imgHtml}
    `;

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
    try {
        await fetch(`${API_GESTION}/incidencias/${incidenciaActual.id_incidencia}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        cerrarModal();
        cargarIncidencias();
    } catch (e) {
        alert('Error al actualizar');
    }
}
