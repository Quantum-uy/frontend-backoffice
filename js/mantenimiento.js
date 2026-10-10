let mantenimientos = [];
let camionesCache = [];
let mantActual = null;

cargarDatos();

async function cargarDatos() {
    try {
        const [resMant, resCam] = await Promise.all([
            fetch(API_RECOLECCION + '/mantenimiento'),
            fetch(API_CAMIONES + '/camiones')
        ]);
        mantenimientos = await resMant.json();
        camionesCache = await resCam.json();
        actualizarKPIs();
        filtrar();
    } catch (e) {
        console.error('Error cargando datos:', e);
    }
}

function actualizarKPIs() {
    document.getElementById('kpi-total').textContent = mantenimientos.length;
    document.getElementById('kpi-pendiente').textContent = mantenimientos.filter(m => m.estado === 'pendiente').length;
    document.getElementById('kpi-en-curso').textContent = mantenimientos.filter(m => m.estado === 'en_curso').length;
    document.getElementById('kpi-completado').textContent = mantenimientos.filter(m => m.estado === 'completado').length;
}

function filtrar() {
    const q = document.getElementById('buscar').value.toLowerCase();
    const estado = document.getElementById('filtro-estado').value;
    const filtrado = mantenimientos.filter(m => {
        const matchTexto = (m.matricula || '').toLowerCase().includes(q) ||
                           (m.tipo || '').toLowerCase().includes(q) ||
                           (m.descripcion || '').toLowerCase().includes(q);
        const matchEstado = !estado || m.estado === estado;
        return matchTexto && matchEstado;
    });
    renderTabla(filtrado);
}

function renderTabla(data) {
    const tbody = document.getElementById('tabla-mantenimiento');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999">No hay registros de mantenimiento</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(m => `
        <tr>
            <td>${m.id_mantenimiento}</td>
            <td>${m.matricula} ${m.modelo ? '(' + m.modelo + ')' : ''}</td>
            <td>${formatTipo(m.tipo)}</td>
            <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.descripcion || '-'}</td>
            <td>${m.fecha || '-'}</td>
            <td><span class="badge ${badgeMant(m.estado)}">${m.estado}</span></td>
            <td><a class="action-link" onclick="verDetalleMant(${m.id_mantenimiento})">Gestionar</a></td>
        </tr>
    `).join('');
}

function formatTipo(tipo) {
    const map = {
        preventivo: 'Preventivo',
        correctivo: 'Correctivo',
        revision: 'Revisión técnica',
        cambio_aceite: 'Cambio de aceite',
        neumaticos: 'Neumáticos',
        frenos: 'Frenos',
        otro: 'Otro'
    };
    return map[tipo] || tipo || '-';
}

function badgeMant(estado) {
    if (estado === 'pendiente')  return 'badge-pending';
    if (estado === 'en_curso')   return 'badge-warning';
    if (estado === 'completado') return 'badge-active';
    return '';
}

function abrirModalNuevo() {
    document.getElementById('form-mantenimiento').reset();
    document.getElementById('mant-fecha').value = new Date().toISOString().split('T')[0];

    const sel = document.getElementById('mant-camion');
    sel.innerHTML = '<option value="">Seleccionar camión...</option>' +
        camionesCache.map(c => `<option value="${c.id_camion}">${c.matricula} — ${c.modelo || ''} (${c.estado})</option>`).join('');

    document.getElementById('modal-titulo').textContent = 'Nuevo mantenimiento';
    document.getElementById('modal-nuevo').classList.add('active');
}

function cerrarModalNuevo() {
    document.getElementById('modal-nuevo').classList.remove('active');
}

document.getElementById('form-mantenimiento').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        id_camion:   parseInt(document.getElementById('mant-camion').value),
        tipo:        document.getElementById('mant-tipo').value,
        fecha:       document.getElementById('mant-fecha').value,
        descripcion: document.getElementById('mant-descripcion').value
    };

    try {
        const res = await fetch(API_RECOLECCION + '/mantenimiento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            cerrarModalNuevo();
            cargarDatos();
            mostrarToast('Mantenimiento registrado correctamente.', 'success');
        } else {
            const err = await res.json();
            alert(err.error || 'Error al registrar');
        }
    } catch (err) {
        alert('Error al conectar con el servidor');
    }
});

function verDetalleMant(id) {
    mantActual = mantenimientos.find(m => m.id_mantenimiento == id);
    if (!mantActual) return;

    document.getElementById('detalle-mant').innerHTML = `
        <p><strong>${mantActual.matricula}</strong> — ${formatTipo(mantActual.tipo)}</p>
        <p style="color:#666;font-size:.9rem">${mantActual.descripcion || 'Sin descripción'}</p>
        <p style="color:#888;font-size:.85rem">Fecha: ${mantActual.fecha}</p>
    `;

    document.getElementById('nuevo-estado-mant').value = mantActual.estado;
    document.getElementById('modal-estado').classList.add('active');
}

function cerrarModalEstado() {
    document.getElementById('modal-estado').classList.remove('active');
    mantActual = null;
}

async function guardarEstadoMant() {
    if (!mantActual) return;
    const nuevoEstado = document.getElementById('nuevo-estado-mant').value;

    try {
        await fetch(`${API_RECOLECCION}/mantenimiento/${mantActual.id_mantenimiento}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        cerrarModalEstado();
        cargarDatos();
        if (nuevoEstado === 'completado') {
            mostrarToast('Mantenimiento completado. Camión disponible.', 'success');
        }
    } catch (e) {
        alert('Error al actualizar estado');
    }
}
